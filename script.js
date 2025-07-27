class DiscountSnake {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameStatus = document.getElementById('gameStatus');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.ctaSection = document.getElementById('ctaSection');
        this.claimBtn = document.getElementById('claimBtn');
        this.restartBtn = document.getElementById('restartBtn');
        
        // Game state
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        this.snake = [{ x: 10, y: 10 }];
        this.food = {};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.eaten = 0;
        this.level = 1;
        this.discount = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameSpeed = 150;
        
        // Discount milestones
        this.discountMilestones = [
            { eaten: 3, discount: 5 },
            { eaten: 7, discount: 10 },
            { eaten: 12, discount: 15 },
            { eaten: 18, discount: 20 },
            { eaten: 25, discount: 25 },
            { eaten: 35, discount: 30 }
        ];
        
        this.setupCanvas();
        this.setupEventListeners();
        this.generateFood();
        this.draw();
    }
    
    setupCanvas() {
        // Make canvas responsive
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth - 60; // padding
        const maxSize = Math.min(containerWidth, 400);
        
        this.canvas.width = maxSize;
        this.canvas.height = maxSize;
        this.tileCount = this.canvas.width / this.gridSize;
        
        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.tileCount = Math.floor(rect.width / this.gridSize);
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    if (this.dy !== 1) { this.dx = 0; this.dy = -1; }
                    break;
                case 'ArrowDown':
                    if (this.dy !== -1) { this.dx = 0; this.dy = 1; }
                    break;
                case 'ArrowLeft':
                    if (this.dx !== 1) { this.dx = -1; this.dy = 0; }
                    break;
                case 'ArrowRight':
                    if (this.dx !== -1) { this.dx = 1; this.dy = 0; }
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
        
        // Touch/Mobile controls
        const controlBtns = document.querySelectorAll('.control-btn[data-direction]');
        controlBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.gameRunning || this.gamePaused) return;
                
                const direction = btn.dataset.direction;
                switch(direction) {
                    case 'up':
                        if (this.dy !== 1) { this.dx = 0; this.dy = -1; }
                        break;
                    case 'down':
                        if (this.dy !== -1) { this.dx = 0; this.dy = 1; }
                        break;
                    case 'left':
                        if (this.dx !== 1) { this.dx = -1; this.dy = 0; }
                        break;
                    case 'right':
                        if (this.dx !== -1) { this.dx = 1; this.dy = 0; }
                        break;
                }
                
                // Visual feedback
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 100);
            });
        });
        
        // Swipe controls for mobile
        let startX, startY;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!this.gameRunning || this.gamePaused) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 30 && this.dx !== -1) {
                    this.dx = 1; this.dy = 0;
                } else if (deltaX < -30 && this.dx !== 1) {
                    this.dx = -1; this.dy = 0;
                }
            } else {
                // Vertical swipe
                if (deltaY > 30 && this.dy !== -1) {
                    this.dx = 0; this.dy = 1;
                } else if (deltaY < -30 && this.dy !== 1) {
                    this.dx = 0; this.dy = -1;
                }
            }
        });
        
        // Button events
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.claimBtn.addEventListener('click', () => this.claimDiscount());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.draw();
        });
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameStatus.classList.add('hidden');
        this.dx = 1;
        this.dy = 0;
        this.gameLoop();
        
        // Update pause button
        this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            this.pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            this.gameStatus.classList.remove('hidden');
            this.gameStatus.querySelector('h2').textContent = 'Пауза';
            this.gameStatus.querySelector('p').textContent = 'Нажмите паузу или пробел для продолжения';
            this.gameStatus.querySelector('.start-btn').style.display = 'none';
        } else {
            this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            this.gameStatus.classList.add('hidden');
            this.gameLoop();
        }
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        setTimeout(() => {
            this.clearCanvas();
            this.moveSnake();
            this.drawFood();
            this.drawSnake();
            
            if (this.checkCollision()) {
                this.gameOver();
                return;
            }
            
            if (this.checkFoodCollision()) {
                this.eatFood();
            }
            
            this.gameLoop();
        }, this.gameSpeed);
    }
    
    clearCanvas() {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid pattern
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawSnake() {
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Head with gradient and glow
                const gradient = this.ctx.createRadialGradient(
                    segment.x * this.gridSize + this.gridSize/2,
                    segment.y * this.gridSize + this.gridSize/2,
                    0,
                    segment.x * this.gridSize + this.gridSize/2,
                    segment.y * this.gridSize + this.gridSize/2,
                    this.gridSize/2
                );
                gradient.addColorStop(0, '#4CAF50');
                gradient.addColorStop(1, '#2E7D32');
                
                this.ctx.fillStyle = gradient;
                this.ctx.shadowColor = '#4CAF50';
                this.ctx.shadowBlur = 10;
                this.ctx.fillRect(
                    segment.x * this.gridSize + 2,
                    segment.y * this.gridSize + 2,
                    this.gridSize - 4,
                    this.gridSize - 4
                );
                
                // Eyes
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(segment.x * this.gridSize + 6, segment.y * this.gridSize + 6, 3, 3);
                this.ctx.fillRect(segment.x * this.gridSize + 11, segment.y * this.gridSize + 6, 3, 3);
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(segment.x * this.gridSize + 7, segment.y * this.gridSize + 7, 1, 1);
                this.ctx.fillRect(segment.x * this.gridSize + 12, segment.y * this.gridSize + 7, 1, 1);
            } else {
                // Body with gradient
                const intensity = 1 - (index / this.snake.length) * 0.5;
                const gradient = this.ctx.createLinearGradient(
                    segment.x * this.gridSize,
                    segment.y * this.gridSize,
                    segment.x * this.gridSize + this.gridSize,
                    segment.y * this.gridSize + this.gridSize
                );
                gradient.addColorStop(0, `rgba(76, 175, 80, ${intensity})`);
                gradient.addColorStop(1, `rgba(46, 125, 50, ${intensity})`);
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(
                    segment.x * this.gridSize + 3,
                    segment.y * this.gridSize + 3,
                    this.gridSize - 6,
                    this.gridSize - 6
                );
            }
        });
        this.ctx.shadowBlur = 0;
    }
    
    drawFood() {
        // Animated food with glow effect
        const time = Date.now() * 0.005;
        const pulse = Math.sin(time) * 0.1 + 0.9;
        
        const gradient = this.ctx.createRadialGradient(
            this.food.x * this.gridSize + this.gridSize/2,
            this.food.y * this.gridSize + this.gridSize/2,
            0,
            this.food.x * this.gridSize + this.gridSize/2,
            this.food.y * this.gridSize + this.gridSize/2,
            this.gridSize/2
        );
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(1, '#EE5A24');
        
        this.ctx.fillStyle = gradient;
        this.ctx.shadowColor = '#FF6B6B';
        this.ctx.shadowBlur = 15 * pulse;
        
        const size = (this.gridSize - 4) * pulse;
        const offset = (this.gridSize - size) / 2;
        
        this.ctx.fillRect(
            this.food.x * this.gridSize + offset,
            this.food.y * this.gridSize + offset,
            size,
            size
        );
        
        this.ctx.shadowBlur = 0;
    }
    
    moveSnake() {
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        this.snake.unshift(head);
        this.snake.pop();
    }
    
    generateFood() {
        this.food = {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
        
        // Make sure food doesn't spawn on snake
        if (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y)) {
            this.generateFood();
        }
    }
    
    checkCollision() {
        const head = this.snake[0];
        
        // Wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }
        
        // Self collision
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    checkFoodCollision() {
        const head = this.snake[0];
        return head.x === this.food.x && head.y === this.food.y;
    }
    
    eatFood() {
        // Grow snake
        this.snake.push({ ...this.snake[this.snake.length - 1] });
        
        // Update stats
        this.score += 10;
        this.eaten++;
        
        // Check for level up
        if (this.eaten % 5 === 0) {
            this.level++;
            this.gameSpeed = Math.max(80, this.gameSpeed - 10);
        }
        
        // Update discount
        this.updateDiscount();
        
        // Generate new food
        this.generateFood();
        
        // Update UI
        this.updateUI();
        
        // Particle effect (simple implementation)
        this.createEatEffect();
    }
    
    updateDiscount() {
        const milestone = this.discountMilestones.find(m => 
            this.eaten >= m.eaten && this.discount < m.discount
        );
        
        if (milestone) {
            this.discount = milestone.discount;
            this.animateDiscountUpdate();
            this.updateMilestones();
        }
    }
    
    animateDiscountUpdate() {
        const discountBadge = document.querySelector('.discount-badge');
        const discountPercent = document.querySelector('.discount-percent');
        
        discountBadge.classList.add('animate');
        discountPercent.textContent = `${this.discount}%`;
        
        setTimeout(() => {
            discountBadge.classList.remove('animate');
        }, 600);
    }
    
    updateMilestones() {
        const milestones = document.querySelectorAll('.milestone');
        milestones.forEach(milestone => {
            const discountValue = parseInt(milestone.dataset.discount);
            
            milestone.classList.remove('active', 'reached', 'animate');
            
            if (this.discount >= discountValue) {
                milestone.classList.add('reached');
            } else if (this.discount < discountValue) {
                const prevMilestone = this.discountMilestones.find(m => m.discount === discountValue);
                if (prevMilestone && this.eaten >= prevMilestone.eaten - 2) {
                    milestone.classList.add('active');
                    milestone.classList.add('animate');
                }
            }
        });
        
        // Update progress bar
        const nextMilestone = this.discountMilestones.find(m => m.discount > this.discount);
        if (nextMilestone) {
            const progress = (this.eaten / nextMilestone.eaten) * 100;
            const progressFill = document.getElementById('progressFill');
            const nextDiscountSpan = document.getElementById('nextDiscount');
            
            progressFill.style.width = `${Math.min(progress, 100)}%`;
            nextDiscountSpan.textContent = `${nextMilestone.discount}%`;
        } else {
            // Max discount reached
            const progressFill = document.getElementById('progressFill');
            const nextDiscountSpan = document.getElementById('nextDiscount');
            
            progressFill.style.width = '100%';
            nextDiscountSpan.textContent = 'МАКС!';
        }
    }
    
    createEatEffect() {
        // Simple visual feedback - could be enhanced with particles
        const canvas = this.canvas;
        const originalFilter = canvas.style.filter;
        
        canvas.style.filter = 'brightness(1.2) saturate(1.3)';
        setTimeout(() => {
            canvas.style.filter = originalFilter;
        }, 150);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('eaten').textContent = this.eaten;
        document.getElementById('level').textContent = this.level;
    }
    
    gameOver() {
        this.gameRunning = false;
        
        // Show final results
        if (this.discount > 0) {
            this.showDiscountClaim();
        } else {
            this.showGameOver();
        }
    }
    
    showDiscountClaim() {
        this.gameStatus.classList.add('hidden');
        this.ctaSection.classList.add('show');
        
        document.getElementById('finalDiscount').textContent = `${this.discount}%`;
    }
    
    showGameOver() {
        this.gameStatus.classList.remove('hidden');
        this.gameStatus.querySelector('h2').textContent = 'Игра окончена!';
        this.gameStatus.querySelector('p').textContent = `Вы набрали ${this.score} очков. Попробуйте еще раз!`;
        this.gameStatus.querySelector('.start-btn').style.display = 'flex';
        this.gameStatus.querySelector('.start-btn').textContent = 'Играть снова';
    }
    
    claimDiscount() {
        // Here you would integrate with your e-commerce system
        alert(`Поздравляем! Ваша скидка ${this.discount}% активирована! 
        
Код скидки: SNAKE${this.discount}${Date.now().toString().slice(-4)}
        
Скидка действительна в течение 24 часов.`);
        
        // Optional: Send discount code to server
        this.sendDiscountToServer();
    }
    
    sendDiscountToServer() {
        // Example API call - replace with your actual endpoint
        const discountData = {
            discount: this.discount,
            score: this.score,
            eaten: this.eaten,
            level: this.level,
            timestamp: new Date().toISOString(),
            code: `SNAKE${this.discount}${Date.now().toString().slice(-4)}`
        };
        
        console.log('Discount data to send:', discountData);
        
        // fetch('/api/discount', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(discountData)
        // });
    }
    
    restartGame() {
        // Reset game state
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.eaten = 0;
        this.level = 1;
        this.discount = 0;
        this.gameSpeed = 150;
        this.gameRunning = false;
        this.gamePaused = false;
        
        // Reset UI
        this.updateUI();
        this.animateDiscountUpdate();
        this.updateMilestones();
        
        // Hide CTA and show start screen
        this.ctaSection.classList.remove('show');
        this.gameStatus.classList.remove('hidden');
        this.gameStatus.querySelector('h2').textContent = 'Готовы начать?';
        this.gameStatus.querySelector('p').textContent = 'Управляйте змейкой и собирайте еду, чтобы увеличить скидку!';
        this.gameStatus.querySelector('.start-btn').style.display = 'flex';
        this.gameStatus.querySelector('.start-btn').innerHTML = '<i class="fas fa-play"></i> Начать игру';
        
        // Reset pause button
        this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        
        // Generate new food and redraw
        this.generateFood();
        this.draw();
    }
    
    draw() {
        this.clearCanvas();
        this.drawFood();
        this.drawSnake();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new DiscountSnake();
    
    // Add some marketing magic
    const title = document.title;
    let titleIndex = 0;
    const titleVariations = [
        'Змейка Скидок - Играй и Экономь!',
        '🐍 Получи скидку до 30%!',
        '🎮 Играй и экономь!',
        '💰 Скидки растут с каждым блоком!'
    ];
    
    setInterval(() => {
        document.title = titleVariations[titleIndex];
        titleIndex = (titleIndex + 1) % titleVariations.length;
    }, 3000);
    
    // Restore original title when page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            document.title = title;
        }
    });
});