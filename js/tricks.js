/**
 * tricks.js — 花招逻辑集合
 */

const Tricks = {
  // 已使用过的理由索引（防止短期重复）
  _usedReasonIndexes: [],
  _lastBirdId: null,  // 记录上次的雀 ID，切换雀时重置索引

  /**
   * 花招1：从雀的理由库随机抽一条（不近期重复）
   */
  getReason(bird) {
    // 切换雀时重置理由索引
    if (bird.id !== this._lastBirdId) {
      this._usedReasonIndexes = [];
      this._lastBirdId = bird.id;
    }

    const reasons = bird.reasons;
    let available = reasons
      .map((r, i) => i)
      .filter(i => !this._usedReasonIndexes.includes(i));

    if (available.length === 0) {
      // 全用过了，重置
      this._usedReasonIndexes = [];
      available = reasons.map((r, i) => i);
    }

    const idx = available[Math.floor(Math.random() * available.length)];
    this._usedReasonIndexes.push(idx);
    // 只记最近5条
    if (this._usedReasonIndexes.length > 5) {
      this._usedReasonIndexes.shift();
    }
    return reasons[idx];
  },

  /**
   * 花招3：命运的捉弄 — 20%概率触发
   * 返回 { triggered: bool, reason: string }
   */
  checkTorment(bird) {
    if (Math.random() < 0.20) {
      const reasons = bird.tormentReasons;
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      return { triggered: true, reason };
    }
    return { triggered: false, reason: null };
  },

  /**
   * 花招4：反问陷阱 — 30%概率触发
   * 返回 null 或 trap question 对象
   */
  maybeGetTrapQuestion() {
    if (Math.random() < 0.30) {
      const q = TRAP_QUESTIONS[Math.floor(Math.random() * TRAP_QUESTIONS.length)];
      return q;
    }
    return null;
  },

  /**
   * 生成反问陷阱的分析语
   * @param {object} bird - 当前雀
   * @param {string} choiceText - 用户选的选项文本
   * @param {string} choiceType - 选项对应的 type 标签
   * @param {string} finalResult - 最终结果
   */
  getTrapAnalysis(bird, choiceText, choiceType, finalResult) {
    const templates = bird.trapAnalysis;
    const tpl = templates[Math.floor(Math.random() * templates.length)];
    return tpl
      .replace('{choice}', choiceText)
      .replace('{type}', choiceType)
      + `，结果是：${finalResult}`;
  },

  /**
   * 花招5：历史修正主义
   * 如果和上次结果一样，偏移到下一个选项
   * 返回 { result, corrected: bool, message: string|null }
   */
  historyCorrection(sceneName, options, randomResult) {
    const lastResult = Storage.getLastResult(sceneName);

    if (lastResult && lastResult === randomResult && options.length > 1) {
      const idx = options.indexOf(randomResult);
      const nextIdx = (idx + 1) % options.length;
      const newResult = options[nextIdx];
      return {
        result: newResult,
        corrected: true,
        message: `上次你选了「${lastResult}」，这次系统帮你换个口味——「${newResult}」。别谢我。`
      };
    }

    return { result: randomResult, corrected: false, message: null };
  },

  /**
   * 随机选一个选项
   */
  randomPick(options) {
    return options[Math.floor(Math.random() * options.length)];
  }
};
