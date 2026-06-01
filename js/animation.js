/**
 * animation.js — 滚动动画
 */

const Animation = {
  /**
   * 滚动选项动画，最后停在 finalResult
   * @param {string[]} options - 所有选项
   * @param {string} finalResult - 最终结果
   * @param {HTMLElement} el - 显示文本的元素
   * @param {Function} callback - 动画结束后回调
   */
  roll(options, finalResult, el, callback) {
    let elapsed = 0;
    const totalDuration = 1600; // 总动画时长 ms
    let interval = 50; // 初始间隔

    const step = () => {
      elapsed += interval;
      // 随机展示一个选项
      const randomOption = options[Math.floor(Math.random() * options.length)];
      el.textContent = randomOption;
      el.classList.add('rolling');

      if (elapsed < totalDuration * 0.5) {
        // 前半段：快速切换 50ms
        interval = 50;
      } else if (elapsed < totalDuration * 0.75) {
        // 中段：稍微慢一点 100ms
        interval = 100;
      } else if (elapsed < totalDuration * 0.9) {
        // 后段：更慢 200ms
        interval = 200;
      } else {
        // 最后阶段：慢慢停下来
        interval = 350;
      }

      if (elapsed >= totalDuration) {
        // 停在最终结果
        el.textContent = finalResult;
        el.classList.remove('rolling');
        el.classList.add('result-bounce');
        setTimeout(() => {
          el.classList.remove('result-bounce');
          callback();
        }, 400);
        return;
      }

      setTimeout(step, interval);
    };

    // 开始动画
    setTimeout(step, interval);
  },

  /**
   * 轮盘动画（旋转效果）
   */
  spinWheel(el, callback) {
    el.classList.add('spinning');
    setTimeout(() => {
      el.classList.remove('spinning');
      callback();
    }, 1000);
  },

  /**
   * 淡入显示
   */
  fadeIn(el, duration = 300) {
    el.style.opacity = '0';
    el.style.display = '';
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      el.style.opacity = progress;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  },

  /**
   * 淡出隐藏
   */
  fadeOut(el, duration = 300, callback) {
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      el.style.opacity = 1 - progress;
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        el.style.display = 'none';
        if (callback) callback();
      }
    };
    requestAnimationFrame(animate);
  },

  /**
   * 从下弹入
   */
  slideUp(el, duration = 350) {
    el.style.transform = 'translateY(40px)';
    el.style.opacity = '0';
    if (el.style.display === 'none' || el.style.display === '') {
      el.style.display = 'block';
    }
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      el.style.transform = `translateY(${40 * (1 - ease)}px)`;
      el.style.opacity = ease;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
};
