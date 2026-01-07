// 掷币者 - 主要JavaScript功能模块
// 包含动画控制、数据可视化、交互响应等核心功能

class CoinTossApp {
    constructor() {
        this.stats = this.loadStats();
        this.achievements = this.loadAchievements();
        this.init();
    }

    init() {
        this.setupGlobalEventListeners();
        this.initScrollAnimations();
        this.initParticleSystem();
        this.setupKeyboardShortcuts();
    }

    // 统计数据管理
    loadStats() {
        const defaultStats = {
            total: 0,
            heads: 0,
            tails: 0,
            edge: 0,
            currentStreak: 0,
            maxStreak: 0,
            lastResult: null,
            history: [],
            sessionStart: Date.now()
        };
        
        const saved = localStorage.getItem('tossStats');
        return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
    }

    saveStats() {
        localStorage.setItem('tossStats', JSON.stringify(this.stats));
    }

    loadAchievements() {
        const defaultAchievements = {
            'first-toss': false,
            'hundred-tosses': false,
            'edge-land': false,
            'perfect-balance': false,
            'long-streak': false,
            'wisdom-seeker': false,
            'probability-master': false,
            'statistical-insight': false
        };
        
        const saved = localStorage.getItem('achievements');
        return saved ? { ...defaultAchievements, ...JSON.parse(saved) } : defaultAchievements;
    }

    saveAchievements() {
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
    }

    // 成就系统
    unlockAchievement(achievementId, showNotification = true) {
        if (!this.achievements[achievementId]) {
            this.achievements[achievementId] = true;
            this.saveAchievements();
            
            // 更新UI
            const achievementElement = document.getElementById(`achievement-${achievementId}`);
            if (achievementElement) {
                achievementElement.classList.add('unlocked');
            }
            
            // 显示通知
            if (showNotification) {
                this.showAchievementNotification(achievementId);
            }
            
            // 触发成就解锁事件
            this.dispatchEvent('achievementUnlocked', { achievementId });
        }
    }

    showAchievementNotification(achievementId) {
        const achievements = {
            'first-toss': { name: '初次投掷', icon: '🎯', desc: '完成第一次掷币' },
            'hundred-tosses': { name: '百次投掷', icon: '💯', desc: '累计投掷100次' },
            'edge-land': { name: '立币奇迹', icon: '⚖️', desc: '见证铜币立住' },
            'perfect-balance': { name: '完美平衡', icon: '⚖️', desc: '正反面次数相等' },
            'long-streak': { name: '连胜纪录', icon: '🔥', desc: '连续10次相同结果' },
            'wisdom-seeker': { name: '智慧探求者', icon: '🧠', desc: '完成所有思考' },
            'probability-master': { name: '概率大师', icon: '🎲', desc: '理解概率论精髓' },
            'statistical-insight': { name: '统计洞察', icon: '📊', desc: '领悟统计规律' }
        };
        
        const achievement = achievements[achievementId];
        if (!achievement) return;
        
        const notification = this.createNotification(`
            <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 2rem;">${achievement.icon}</span>
                <div>
                    <div style="font-weight: bold; font-size: 1.1rem;">${achievement.name}</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">${achievement.desc}</div>
                </div>
            </div>
        `, 'achievement');
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.5s ease';
                setTimeout(() => notification.remove(), 500);
            }
        }, 3000);
    }

    createNotification(content, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'achievement' ? 'rgba(212, 175, 55, 0.95)' : 'rgba(26, 26, 46, 0.95)'};
            color: ${type === 'achievement' ? '#1a1a2e' : '#c0c0c0'};
            padding: 1rem 1.5rem;
            border-radius: 10px;
            border: 1px solid ${type === 'achievement' ? '#d4af37' : 'rgba(212, 175, 55, 0.3)'};
            backdrop-filter: blur(10px);
            z-index: 10000;
            animation: slideIn 0.5s ease;
            max-width: 400px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        notification.innerHTML = content;
        
        return notification;
    }

    // 全局事件系统
    setupGlobalEventListeners() {
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 't':
                        e.preventDefault();
                        this.tossCoin();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.resetStats();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.autoToss();
                        break;
                }
            }
        });

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });

        // 窗口大小变化
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));
    }

    setupKeyboardShortcuts() {
        // 显示快捷键帮助
        document.addEventListener('keydown', (e) => {
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.showKeyboardShortcuts();
            }
        });
    }

    showKeyboardShortcuts() {
        const shortcuts = [
            { key: 'Space', desc: '投掷硬币' },
            { key: 'Ctrl/Cmd + T', desc: '投掷硬币' },
            { key: 'Ctrl/Cmd + R', desc: '重置统计' },
            { key: 'Ctrl/Cmd + A', desc: '自动投掷' },
            { key: '?', desc: '显示快捷键' }
        ];
        
        const content = `
            <h3 style="color: #d4af37; margin-bottom: 1rem;">键盘快捷键</h3>
            ${shortcuts.map(s => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-family: monospace; background: rgba(212, 175, 55, 0.2); padding: 0.2rem 0.5rem; border-radius: 3px;">${s.key}</span>
                    <span>${s.desc}</span>
                </div>
            `).join('')}
        `;
        
        const notification = this.createNotification(content);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.5s ease';
                setTimeout(() => notification.remove(), 500);
            }
        }, 5000);
    }

    // 粒子系统
    initParticleSystem() {
        if (typeof p5 === 'undefined') return;
        
        // 创建粒子画布
        const particleCanvas = document.getElementById('particles-canvas');
        if (!particleCanvas) return;
        
        new p5((p) => {
            let particles = [];
            let mouseInfluence = 100;
            
            p.setup = () => {
                p.createCanvas(window.innerWidth, window.innerHeight);
                
                // 创建粒子
                for (let i = 0; i < 80; i++) {
                    particles.push({
                        x: p.random(p.width),
                        y: p.random(p.height),
                        vx: p.random(-0.5, 0.5),
                        vy: p.random(-0.5, 0.5),
                        size: p.random(1, 3),
                        opacity: p.random(0.1, 0.4),
                        hue: p.random(30, 60) // 金色色调
                    });
                }
            };
            
            p.draw = () => {
                p.clear();
                
                // 更新和绘制粒子
                particles.forEach(particle => {
                    // 鼠标影响
                    const mouseDistance = p.dist(p.mouseX, p.mouseY, particle.x, particle.y);
                    if (mouseDistance < mouseInfluence) {
                        const force = (mouseInfluence - mouseDistance) / mouseInfluence;
                        particle.vx += (particle.x - p.mouseX) * force * 0.01;
                        particle.vy += (particle.y - p.mouseY) * force * 0.01;
                    }
                    
                    // 更新位置
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    
                    // 边界检测
                    if (particle.x < 0 || particle.x > p.width) particle.vx *= -1;
                    if (particle.y < 0 || particle.y > p.height) particle.vy *= -1;
                    
                    // 绘制粒子
                    p.fill(particle.hue, 80, 100, particle.opacity * 100);
                    p.noStroke();
                    p.ellipse(particle.x, particle.y, particle.size);
                });
                
                // 连接近距离粒子
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const distance = p.dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                        if (distance < 80) {
                            p.stroke(45, 80, 100, (80 - distance) * 0.5);
                            p.strokeWeight(0.5);
                            p.line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                        }
                    }
                }
            };
            
            p.windowResized = () => {
                p.resizeCanvas(window.innerWidth, window.innerHeight);
            };
        }, particleCanvas);
    }

    // 滚动动画
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, observerOptions);

        // 观察需要动画的元素
        document.querySelectorAll('.fade-in-up, .concept-card, .chapter, .experiment-card').forEach(el => {
            observer.observe(el);
        });
    }

    animateElement(element) {
        if (element.classList.contains('animated')) return;
        
        element.classList.add('animated');
        
        anime({
            targets: element,
            opacity: [0, 1],
            translateY: [50, 0],
            duration: 800,
            easing: 'easeOutExpo',
            delay: Math.random() * 200
        });
    }

    // 工具函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 事件分发
    dispatchEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    // 响应式处理
    handleResize() {
        // 重新初始化图表
        if (window.probabilityChart) {
            window.probabilityChart.resize();
        }
        
        // 重新初始化粒子系统
        this.initParticleSystem();
    }

    pauseAnimations() {
        document.querySelectorAll('.animated').forEach(el => {
            el.style.animationPlayState = 'paused';
        });
    }

    resumeAnimations() {
        document.querySelectorAll('.animated').forEach(el => {
            el.style.animationPlayState = 'running';
        });
    }

    // 数据分析
    getStatisticalSummary() {
        const { total, heads, tails, edge, history } = this.stats;
        
        return {
            total,
            heads,
            tails,
            edge,
            headsFrequency: total > 0 ? heads / total : 0,
            tailsFrequency: total > 0 ? tails / total : 0,
            edgeFrequency: total > 0 ? edge / total : 0,
            chiSquared: this.calculateChiSquared(),
            entropy: this.calculateEntropy(),
            longestStreak: this.findLongestStreak(),
            averageStreak: this.calculateAverageStreak()
        };
    }

    calculateChiSquared() {
        const { total, heads, tails } = this.stats;
        if (total === 0) return 0;
        
        const expected = total / 2;
        const chiSquared = Math.pow(heads - expected, 2) / expected + 
                          Math.pow(tails - expected, 2) / expected;
        return chiSquared;
    }

    calculateEntropy() {
        const { total, heads, tails } = this.stats;
        if (total === 0) return 0;
        
        const pHeads = heads / total;
        const pTails = tails / total;
        
        let entropy = 0;
        if (pHeads > 0) entropy -= pHeads * Math.log2(pHeads);
        if (pTails > 0) entropy -= pTails * Math.log2(pTails);
        
        return entropy;
    }

    findLongestStreak() {
        const { history } = this.stats;
        if (history.length === 0) return 0;
        
        let maxStreak = 1;
        let currentStreak = 1;
        let currentResult = history[0];
        
        for (let i = 1; i < history.length; i++) {
            if (history[i] === currentResult) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
                currentResult = history[i];
            }
        }
        
        return maxStreak;
    }

    calculateAverageStreak() {
        const { history } = this.stats;
        if (history.length === 0) return 0;
        
        let streaks = [];
        let currentStreak = 1;
        let currentResult = history[0];
        
        for (let i = 1; i < history.length; i++) {
            if (history[i] === currentResult) {
                currentStreak++;
            } else {
                streaks.push(currentStreak);
                currentStreak = 1;
                currentResult = history[i];
            }
        }
        streaks.push(currentStreak);
        
        return streaks.reduce((sum, streak) => sum + streak, 0) / streaks.length;
    }

    // 导出数据
    exportData() {
        const data = {
            stats: this.stats,
            achievements: this.achievements,
            summary: this.getStatisticalSummary(),
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `coin-toss-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    // 导入数据
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.stats && data.achievements) {
                    this.stats = data.stats;
                    this.achievements = data.achievements;
                    this.saveStats();
                    this.saveAchievements();
                    
                    this.showNotification('数据导入成功！', 'success');
                    location.reload();
                } else {
                    throw new Error('Invalid data format');
                }
            } catch (error) {
                this.showNotification('数据导入失败：文件格式错误', 'error');
            }
        };
        reader.readAsText(file);
    }

    showNotification(message, type = 'info') {
        const notification = this.createNotification(message, type);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.5s ease';
                setTimeout(() => notification.remove(), 500);
            }
        }, 3000);
    }
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CoinTossApp();
    
    // 全局访问
    window.CoinTossApp = app;
});

// 导出到全局作用域
window.CoinTossUtils = {
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    formatNumber: (num, decimals = 2) => {
        return Number(num).toFixed(decimals);
    },
    
    randomChoice: (array) => {
        return array[Math.floor(Math.random() * array.length)];
    },
    
    shuffle: (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
};

// 性能监控
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('页面加载性能:', {
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                totalTime: perfData.loadEventEnd - perfData.fetchStart
            });
        }, 0);
    });
}

// 错误处理
window.addEventListener('error', (e) => {
    console.error('JavaScript错误:', e.error);
    
    // 可以在这里添加错误上报逻辑
    if (app && app.showNotification) {
        app.showNotification('发生了一个错误，请刷新页面重试', 'error');
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
    
    if (app && app.showNotification) {
        app.showNotification('网络请求失败，请检查网络连接', 'error');
    }
});

// 服务工作者注册（用于离线支持）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW注册成功:', registration);
            })
            .catch(error => {
                console.log('SW注册失败:', error);
            });
    });
}

console.log('🎲 掷币者应用已加载 - 探索概率的奥秘，感悟数学的魅力');