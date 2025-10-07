// Performance optimization utilities

export const Performance = {
    // Performance monitoring
    startTime: Date.now(),
    metrics: {
        renderCount: 0,
        avgRenderTime: 0,
        lastRenderTime: 0
    },

    // Measure render performance
    startRender() {
        if (typeof performance !== 'undefined' && performance.now) {
            this.renderStart = performance.now();
        } else {
            this.renderStart = Date.now();
        }
    },

    endRender() {
        if (this.renderStart) {
            const renderTime = (typeof performance !== 'undefined' && performance.now) 
                ? performance.now() - this.renderStart 
                : Date.now() - this.renderStart;
            this.metrics.renderCount++;
            this.metrics.lastRenderTime = renderTime;
            this.metrics.avgRenderTime = ((this.metrics.avgRenderTime * (this.metrics.renderCount - 1)) + renderTime) / this.metrics.renderCount;
            
            if (renderTime > 50) { // Log slow renders
                console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`);
            }
        }
    },

    // Debounce function for expensive operations
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
    },

    // Throttle function for high-frequency events
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Memory cleanup for large datasets
    cleanupOldData(dataArray, maxEntries = 1000) {
        if (dataArray && dataArray.length > maxEntries) {
            return dataArray.slice(-maxEntries); // Keep only recent entries
        }
        return dataArray;
    },

    // Optimize DOM updates by batching
    batchDOMUpdates(updates) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                updates.forEach(update => update());
                resolve();
            });
        });
    },

    // Virtual scrolling helper for large lists
    virtualizeList(items, containerHeight, itemHeight) {
        const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // +2 for buffer
        return {
            visibleItems: items.slice(0, visibleCount),
            totalHeight: items.length * itemHeight,
            shouldVirtualize: items.length > visibleCount
        };
    },

    // Image lazy loading helper
    lazyLoadImage(img, src) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    img.src = src;
                    observer.unobserve(img);
                }
            });
        });
        observer.observe(img);
    },

    // Get performance stats
    getStats() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.startTime,
            memoryUsage: (typeof performance !== 'undefined' && performance.memory) ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null
        };
    },

    // Log performance summary
    logStats() {
        const stats = this.getStats();
        console.group('🚀 Performance Stats');
        console.log('Renders:', stats.renderCount);
        console.log('Avg render time:', stats.avgRenderTime.toFixed(2) + 'ms');
        console.log('Last render time:', stats.lastRenderTime.toFixed(2) + 'ms');
        console.log('Uptime:', Math.round(stats.uptime / 1000) + 's');
        if (stats.memoryUsage) {
            console.log('Memory:', `${stats.memoryUsage.used}MB / ${stats.memoryUsage.total}MB`);
        }
        console.groupEnd();
    }
};

// Auto-log stats every 30 seconds in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    setInterval(() => Performance.logStats(), 30000);
}

// Database query optimization helpers
export const DatabaseOptimization = {
    // Cache for frequently accessed data
    cache: new Map(),
    cacheExpiry: new Map(),
    defaultTTL: 5 * 60 * 1000, // 5 minutes

    // Get data with caching
    async getCached(key, fetchFunction, ttl = this.defaultTTL) {
        const now = Date.now();
        
        // Check if cached and not expired
        if (this.cache.has(key) && this.cacheExpiry.get(key) > now) {
            return this.cache.get(key);
        }

        // Fetch new data
        const data = await fetchFunction();
        
        // Cache the result
        this.cache.set(key, data);
        this.cacheExpiry.set(key, now + ttl);
        
        return data;
    },

    // Clear expired cache entries
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, expiry] of this.cacheExpiry.entries()) {
            if (expiry <= now) {
                this.cache.delete(key);
                this.cacheExpiry.delete(key);
            }
        }
    },

    // Clear all cache
    clearCache() {
        this.cache.clear();
        this.cacheExpiry.clear();
    },

    // Batch database operations
    batchOperations: [],
    
    addToBatch(operation) {
        this.batchOperations.push(operation);
        
        // Auto-flush batch when it gets large
        if (this.batchOperations.length >= 10) {
            this.flushBatch();
        }
    },

    async flushBatch() {
        if (this.batchOperations.length === 0) return;
        
        const operations = [...this.batchOperations];
        this.batchOperations = [];
        
        // Execute all operations in parallel
        await Promise.all(operations.map(op => op().catch(console.error)));
    }
};

// Clean up expired cache every 5 minutes
setInterval(() => DatabaseOptimization.clearExpiredCache(), 5 * 60 * 1000);