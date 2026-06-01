/**
 * app.js — 雀定主逻辑 v2.0
 * 已集成 Router 模块，支持深度链接、导航状态管理、页面过渡
 */

// ===== 内置场景 =====
const BUILTIN_SCENES = [
  {
    id: 'eat',
    name: '今天吃啥',
    emoji: '🍜',
    options: ['黄焖鸡', '麻辣烫', '沙县小吃', '兰州拉面', '炸鸡汉堡', '螺蛳粉', '外卖随便', '自己做饭', '寿司', '烤肉', '火锅', '盖浇饭']
  },
  {
    id: 'play',
    name: '今天去哪玩',
    emoji: '🌳',
    options: ['公园散步', '逛商场', '看电影', '宅在家', '图书馆', '咖啡厅', '博物馆', '去爬山', '逛书店', '溜冰场']
  },
  {
    id: 'wear',
    name: '今天穿啥',
    emoji: '👗',
    options: ['休闲风', '正式装', '运动风', '复古风', '随便穿', '连衣裙', '牛仔套装', '卫衣+短裤']
  },
  {
    id: 'movie',
    name: '看什么电影',
    emoji: '🎬',
    options: ['喜剧', '爱情', '动作', '科幻', '恐怖', '纪录片', '动画', '悬疑']
  },
  {
    id: 'drink',
    name: '喝点什么',
    emoji: '☕',
    options: ['奶茶', '咖啡', '果汁', '白开水', '气泡水', '豆浆', '可乐', '绿茶', '柠檬水']
  }
];

// ===== App 状态 =====
const AppState = {
  currentBird: null,
  currentScene: null,   // { id, name, emoji, options }
  rerollCount: 0,
  lastResult: null,
  pendingTrapQuestion: null,
  pendingTrapChoice: null,
  isInitialized: false  // 防止重复初始化
};

// ===== 页面路由（旧方法已废弃，保留兼容）=====
/**
 * @deprecated 请使用 Router.push() 代替
 */
function showPage(pageId) {
  console.warn('[App] showPage 已废弃，请使用 Router.push()');
  const page = document.getElementById(pageId);
  if (page) {
    // 直接显示，不走路由（保留旧兼容性）
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
      p.classList.add('page-hidden');
    });
    page.classList.add('active');
    page.classList.remove('page-hidden');
  }
}

// ===== 选雀页 =====
function initBirdSelect() {
  const grid = document.getElementById('bird-grid');
  grid.innerHTML = '';

  // 设置选雀页顶部大图标
  const headerSvg = document.getElementById('header-bird-svg');
  if (headerSvg) {
    headerSvg.innerHTML = '<img src="images/bird-normal.jpg" alt="雀定" style="width:80px;height:80px;border-radius:50%;object-fit:cover;">';
  }

  Object.values(BIRDS).forEach(bird => {
    const card = document.createElement('div');
    card.className = 'bird-card';
    card.dataset.birdId = bird.id; // 添加 data 属性便于路由处理
    card.style.setProperty('--bird-color', bird.color);
    card.style.setProperty('--bird-bg', bird.bgColor);
    
    // 优先显示图片，fallback到emoji
    const avatarHTML = bird.image 
      ? `<img class="bird-avatar-img" src="${bird.image}" alt="${bird.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; this.nextElementSibling.style.alignItems='center'; this.nextElementSibling.style.justifyContent='center';">
         <span class="bird-emoji" style="display:none;width:80px;height:80px;margin:0 auto 8px;">${bird.emoji}</span>`
      : `<span class="bird-emoji">${bird.emoji}</span>`;
    
    card.innerHTML = `
      ${avatarHTML}
      <div class="bird-name">${bird.name}</div>
      <div class="bird-desc">${bird.desc}</div>
      <div class="bird-sample">"${bird.reasons[0]}"</div>
    `;
    card.addEventListener('click', () => selectBird(bird.id));
    grid.appendChild(card);
  });
}

/**
 * 选择雀
 * @param {string} birdId - 雀 ID
 */
function selectBird(birdId) {
  AppState.currentBird = BIRDS[birdId];
  Storage.saveBird(birdId);
  updateBirdDisplay();
  
  // 使用路由导航到首页
  Router.push(Routes.HOME);
}

/**
 * 更新雀显示（顶部徽章）
 */
function updateBirdDisplay() {
  const bird = AppState.currentBird;
  if (!bird) return;
  
  // 更新首页顶部徽章
  const el = document.getElementById('current-bird-badge');
  if (el) {
    el.innerHTML = bird.image 
      ? `<img src="${bird.image}" alt="${bird.name}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px;border:2px solid ${bird.color};">${bird.name}`
      : bird.emoji + ' ' + bird.name;
    el.style.background = bird.bgColor;
    el.style.color = bird.color;
    el.style.borderColor = bird.color;
  }
  
  // 更新决策页顶部徽章
  const el2 = document.getElementById('current-bird-badge-2');
  if (el2) {
    el2.innerHTML = bird.image 
      ? `<img src="${bird.image}" alt="${bird.name}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px;border:2px solid ${bird.color};">${bird.name}`
      : bird.emoji + ' ' + bird.name;
    el2.style.background = bird.bgColor;
    el2.style.color = bird.color;
    el2.style.borderColor = bird.color;
  }
}

// ===== 主页 — 场景列表 =====
function initMainPage() {
  renderBuiltinScenes();
  renderCustomScenes();
  initCustomSceneForm();
}

function renderBuiltinScenes() {
  const container = document.getElementById('builtin-scenes');
  container.innerHTML = '';
  BUILTIN_SCENES.forEach(scene => {
    container.appendChild(createSceneCard(scene, false));
  });
}

function renderCustomScenes() {
  const container = document.getElementById('custom-scenes');
  const scenes = Storage.getCustomScenes();
  container.innerHTML = '';
  if (scenes.length === 0) {
    container.innerHTML = '<p class="empty-hint">还没有自定义场景，在下方添加吧 👇</p>';
    return;
  }
  scenes.forEach(scene => {
    container.appendChild(createSceneCard(scene, true));
  });
}

function createSceneCard(scene, isCustom) {
  const card = document.createElement('div');
  card.className = 'scene-card';
  card.dataset.sceneId = scene.id; // 添加 data 属性
  card.innerHTML = `
    <span class="scene-emoji">${scene.emoji || '🎲'}</span>
    <span class="scene-name">${scene.name}</span>
    <span class="scene-count">${scene.options.length}个选项</span>
    ${isCustom ? `
      <button class="scene-edit-btn" title="编辑">✏️</button>
      <button class="scene-delete-btn" title="删除">×</button>
    ` : ''}
  `;
  card.addEventListener('click', (e) => {
    if (e.target.classList.contains('scene-delete-btn') || e.target.classList.contains('scene-edit-btn')) return;
    startDecision(scene);
  });
  if (isCustom) {
    card.querySelector('.scene-delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCustomScene(scene.id);
    });
    card.querySelector('.scene-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      editCustomScene(scene);
    });
  }
  return card;
}

function deleteCustomScene(id) {
  Storage.removeCustomScene(id);
  renderCustomScenes();
}

function initCustomSceneForm() {
  const btn = document.getElementById('add-custom-scene-btn');
  const form = document.getElementById('custom-scene-form');
  const cancelBtn = document.getElementById('cancel-custom-scene');
  const saveBtn = document.getElementById('save-custom-scene');

  // emoji 选择器
  const emojiPicker = document.getElementById('emoji-picker');
  emojiPicker.addEventListener('click', (e) => {
    const option = e.target.closest('.emoji-option');
    if (!option) return;
    emojiPicker.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
    option.classList.add('selected');
  });

  btn.addEventListener('click', () => {
    // 新建模式
    document.getElementById('custom-scene-edit-id').value = '';
    document.getElementById('custom-scene-name').value = '';
    document.getElementById('custom-scene-options').value = '';
    selectEmoji('✨');
    form.style.display = 'block';
    Animation.slideUp(form);
    btn.style.display = 'none';
  });

  cancelBtn.addEventListener('click', () => {
    form.style.display = 'none';
    btn.style.display = '';
    clearCustomSceneForm();
  });

  saveBtn.addEventListener('click', () => {
    saveCustomScene();
  });
}

function selectEmoji(emoji) {
  const emojiPicker = document.getElementById('emoji-picker');
  emojiPicker.querySelectorAll('.emoji-option').forEach(o => {
    o.classList.toggle('selected', o.dataset.emoji === emoji);
  });
}

function getSelectedEmoji() {
  const selected = document.querySelector('#emoji-picker .emoji-option.selected');
  return selected ? selected.dataset.emoji : '✨';
}

function clearCustomSceneForm() {
  document.getElementById('custom-scene-name').value = '';
  document.getElementById('custom-scene-options').value = '';
  document.getElementById('custom-scene-edit-id').value = '';
  selectEmoji('✨');
}

function editCustomScene(scene) {
  const btn = document.getElementById('add-custom-scene-btn');
  const form = document.getElementById('custom-scene-form');

  // 填入现有数据
  document.getElementById('custom-scene-edit-id').value = scene.id;
  document.getElementById('custom-scene-name').value = scene.name;
  document.getElementById('custom-scene-options').value = scene.options.join('，');
  selectEmoji(scene.emoji || '✨');

  // 显示表单
  form.style.display = 'block';
  Animation.slideUp(form);
  btn.style.display = 'none';
}

function saveCustomScene() {
  const editId = document.getElementById('custom-scene-edit-id').value;
  const name = document.getElementById('custom-scene-name').value.trim();
  const optionsRaw = document.getElementById('custom-scene-options').value.trim();
  const emoji = getSelectedEmoji();

  if (!name) {
    alert('请输入场景名称');
    return;
  }
  const options = optionsRaw.split(/[,，\n]+/).map(s => s.trim()).filter(Boolean);
  if (options.length < 2) {
    alert('请至少输入2个选项（用逗号或换行分隔）');
    return;
  }

  if (editId) {
    // 编辑模式：更新已有场景
    Storage.updateCustomScene(editId, { name, emoji, options });
  } else {
    // 新建模式
    const scene = {
      id: 'custom_' + Date.now(),
      name,
      emoji,
      options
    };
    Storage.addCustomScene(scene);
  }

  renderCustomScenes();
  document.getElementById('custom-scene-form').style.display = 'none';
  document.getElementById('add-custom-scene-btn').style.display = '';
  clearCustomSceneForm();
}

// ===== 决策流程 =====
/**
 * 开始决策流程
 * @param {Object} scene - 场景对象
 */
function startDecision(scene) {
  AppState.currentScene = scene;
  AppState.rerollCount = 0;
  AppState.pendingTrapQuestion = null;
  AppState.pendingTrapChoice = null;
  
  // 通过路由导航到决策页
  goDecision(scene.id);
}

/**
 * 初始化决策页（由路由回调触发）
 */
function initDecisionPage() {
  // 检查是否有待处理的场景
  let scene = AppState.currentScene;
  
  // 如果没有，检查是否通过路由参数传入
  if (!scene && window.__QUEDING_SCENE__) {
    scene = window.__QUEDING_SCENE__;
    window.__QUEDING_SCENE__ = null;
    AppState.currentScene = scene;
  }
  
  if (!scene) {
    console.warn('[App] 决策页初始化失败：没有场景数据');
    goHome();
    return;
  }
  
  // 更新场景标题
  document.getElementById('decision-scene-title').textContent = (scene.emoji || '🎲') + ' ' + scene.name;

  // 显示当前选项列表
  renderDecisionOptions(scene.options);

  // 隐藏结果区
  const resultArea = document.getElementById('result-area');
  resultArea.style.display = 'none';
  resultArea.classList.remove('show');

  // 显示决策按钮，隐藏重来按钮
  document.getElementById('decide-btn').style.display = '';
  document.getElementById('manual-decide-btn').style.display = '';
  document.getElementById('reroll-btn').style.display = 'none';
  document.getElementById('done-btn').style.display = 'none';

  // 确保编辑区关闭
  document.getElementById('options-edit-area').style.display = 'none';
  document.getElementById('options-list').style.display = '';
  document.getElementById('toggle-edit-options').style.display = '';

  // 隐藏陷阱区
  document.getElementById('trap-area').style.display = 'none';

  // 更新雀显示
  const bird = AppState.currentBird;
  if (bird) {
    // 检查图片是否存在，如果不存在则显示 emoji
    if (bird.image) {
      document.getElementById('decision-bird-emoji').innerHTML = `<img src="${bird.image}" alt="${bird.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'; this.parentElement.innerHTML='${bird.emoji}';">`;
    } else {
      document.getElementById('decision-bird-emoji').textContent = bird.emoji;
    }
    document.getElementById('decision-bird-name').textContent = bird.name;
    document.getElementById('bird-speech').textContent = '让我来帮你决定！';
  }
}

function renderDecisionOptions(options) {
  const container = document.getElementById('options-list');
  container.innerHTML = '';
  options.forEach(opt => {
    const chip = document.createElement('span');
    chip.className = 'option-chip';
    chip.textContent = opt;
    container.appendChild(chip);
  });
}

// ===== 选项编辑功能 =====
let _editingOptions = []; // 编辑中的临时选项列表

function openOptionsEditor() {
  const scene = AppState.currentScene;
  if (!scene) return;
  _editingOptions = [...scene.options];
  renderOptionsEditList();
  document.getElementById('options-list').style.display = 'none';
  document.getElementById('options-edit-area').style.display = 'block';
  document.getElementById('toggle-edit-options').style.display = 'none';
}

function closeOptionsEditor() {
  document.getElementById('options-list').style.display = '';
  document.getElementById('options-edit-area').style.display = 'none';
  document.getElementById('toggle-edit-options').style.display = '';
}

function renderOptionsEditList() {
  const container = document.getElementById('options-edit-list');
  container.innerHTML = '';
  _editingOptions.forEach((opt, idx) => {
    const item = document.createElement('div');
    item.className = 'option-edit-item';
    item.innerHTML = `
      <input type="text" value="${opt}" maxlength="20" data-idx="${idx}" class="option-edit-input" />
      <button class="option-edit-delete" data-idx="${idx}" title="删除">×</button>
    `;
    container.appendChild(item);
  });

  // 绑定修改事件
  container.querySelectorAll('.option-edit-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      _editingOptions[idx] = e.target.value.trim();
    });
  });

  // 绑定删除事件
  container.querySelectorAll('.option-edit-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.idx);
      _editingOptions.splice(idx, 1);
      renderOptionsEditList();
    });
  });
}

function addOptionFromInput() {
  const input = document.getElementById('option-add-input');
  const val = input.value.trim();
  if (!val) {
    alert('请输入选项内容');
    return;
  }
  if (_editingOptions.includes(val)) {
    alert('该选项已存在');
    return;
  }
  _editingOptions.push(val);
  input.value = '';
  renderOptionsEditList();
}

function saveOptionsEdit() {
  // 过滤空选项
  const cleaned = _editingOptions.filter(s => s.trim() !== '');
  if (cleaned.length < 2) {
    alert('至少保留2个有效选项');
    return;
  }

  const scene = AppState.currentScene;
  scene.options = cleaned;

  // 如果是自定义场景，持久化保存
  if (scene.id && scene.id.startsWith('custom_')) {
    Storage.updateCustomScene(scene.id, { options: cleaned });
  }

  renderDecisionOptions(cleaned);
  closeOptionsEditor();
}

// 点击"帮我决定！"
function onDecideClick() {
  const bird = AppState.currentBird;
  const scene = AppState.currentScene;

  // 隐藏决策按钮
  document.getElementById('decide-btn').style.display = 'none';
  document.getElementById('manual-decide-btn').style.display = 'none';

  // 检查反问陷阱 (30%)
  const trapQ = Tricks.maybeGetTrapQuestion();
  if (trapQ) {
    AppState.pendingTrapQuestion = trapQ;
    showTrapQuestion(trapQ);
  } else {
    startRollAnimation();
  }
}

function showTrapQuestion(trapQ) {
  const area = document.getElementById('trap-area');
  area.style.display = 'block';
  document.getElementById('trap-question-text').textContent = trapQ.question;

  const btnContainer = document.getElementById('trap-options');
  btnContainer.innerHTML = '';
  trapQ.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'trap-btn';
    btn.textContent = opt.text;
    btn.addEventListener('click', () => onTrapChoose(opt));
    btnContainer.appendChild(btn);
  });

  Animation.slideUp(area);
  document.getElementById('bird-speech').textContent = trapQ.question;
}

function onTrapChoose(opt) {
  AppState.pendingTrapChoice = opt;
  document.getElementById('trap-area').style.display = 'none';
  // 假装分析中
  document.getElementById('bird-speech').textContent = '好的，正在用特殊算法分析你的选择…';
  setTimeout(() => startRollAnimation(), 900);
}

function startRollAnimation() {
  const scene = AppState.currentScene;
  const options = scene.options;
  const bird = AppState.currentBird;

  // 花招5：历史修正
  const rawResult = Tricks.randomPick(options);
  const correction = Tricks.historyCorrection(scene.id, options, rawResult);
  const finalResult = correction.result;

  // 花招3：命运捉弄
  const torment = Tricks.checkTorment(bird);

  // 显示滚动动画区域
  const resultArea = document.getElementById('result-area');
  resultArea.style.display = 'block';
  resultArea.classList.remove('show');
  document.getElementById('result-text').textContent = '';
  document.getElementById('result-reason').textContent = '';
  document.getElementById('correction-msg').textContent = '';

  // 显示滚动
  const el = document.getElementById('result-text');
  el.textContent = '...';

  Animation.roll(options, finalResult, el, () => {
    // 动画结束，显示理由
    onRollDone(finalResult, correction, torment);
  });
}

function onRollDone(finalResult, correction, torment) {
  const bird = AppState.currentBird;
  const scene = AppState.currentScene;

  // 保存结果
  Storage.saveLastResult(scene.id, finalResult);
  Storage.addHistory({
    scene: scene.name,
    sceneId: scene.id,  // 保存场景 ID 便于后续处理
    options: scene.options,
    result: finalResult,
    timestamp: Date.now(),
    bird: bird.name
  });
  AppState.lastResult = finalResult;

  // 生成理由
  let reason = '';
  let reasonIncludesResult = false; // 反问陷阱的分析语已包含结果
  if (AppState.pendingTrapChoice) {
    // 反问陷阱分析语
    reason = Tricks.getTrapAnalysis(bird, AppState.pendingTrapChoice.value, AppState.pendingTrapChoice.type, finalResult);
    reasonIncludesResult = true;
  } else if (torment.triggered) {
    reason = torment.reason;
  } else {
    reason = Tricks.getReason(bird);
  }

  // 拼接结果到理由文字中
  const resultSuffix = reasonIncludesResult ? '' : ' ——「' + finalResult + '」';
  const fullReason = reason + resultSuffix;

  // 更新 UI - 使用图片替代 emoji
  const resultBirdIcon = bird.image 
    ? `<img src="${bird.image}" alt="" style="width:20px;height:20px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:4px;border:2px solid ${bird.color};">`
    : bird.emoji;
  document.getElementById('result-reason').innerHTML = resultBirdIcon + ' ' + fullReason;

  // 历史修正消息
  if (correction.corrected && correction.message) {
    document.getElementById('correction-msg').textContent = '📝 ' + correction.message;
  }

  // 显示重来/完成按钮
  document.getElementById('result-area').classList.add('show');
  document.getElementById('reroll-btn').style.display = '';
  document.getElementById('done-btn').style.display = '';

  // 雀说话
  document.getElementById('bird-speech').textContent = fullReason;
}

// 重来一次
function onRerollClick() {
  AppState.rerollCount++;
  if (AppState.rerollCount >= 3) {
    // 提示已经重选3次以上
    const overlay = document.getElementById('reroll-warning');
    if (overlay) overlay.style.display = 'flex';
    return;
  }

  // 重置状态
  AppState.pendingTrapQuestion = null;
  AppState.pendingTrapChoice = null;

  // 隐藏结果区，重新开始
  document.getElementById('result-area').classList.remove('show');
  document.getElementById('reroll-btn').style.display = 'none';
  document.getElementById('done-btn').style.display = 'none';
  document.getElementById('trap-area').style.display = 'none';
  document.getElementById('manual-decide-btn').style.display = '';

  // 等一下再开始滚动
  setTimeout(() => {
    const trapQ = Tricks.maybeGetTrapQuestion();
    if (trapQ) {
      AppState.pendingTrapQuestion = trapQ;
      showTrapQuestion(trapQ);
    } else {
      startRollAnimation();
    }
  }, 300);
}

// 完成决策 - 返回首页
function onDoneClick() {
  goHome();
}

// ===== 打赏功能 =====
// 替换成你自己的爱发电链接
const SPONSOR_AFDIAN_URL = 'https://afdian.com/a/queding';

function openSponsorModal() {
  const link = document.getElementById('sponsor-afdian-link');
  if (link) link.href = SPONSOR_AFDIAN_URL;
  const modal = document.getElementById('sponsor-modal');
  modal.style.display = 'flex';
}

function closeSponsorModal() {
  const modal = document.getElementById('sponsor-modal');
  modal.style.display = 'none';
}

function updateSponsorVisibility(routeName) {
  var btn = document.getElementById('sponsor-float-btn');
  if (!btn) return;
  // 打赏按钮在所有页面都显示
  btn.style.display = '';
}

// ===== 手动决定功能 =====
function openManualDecide() {
  const scene = AppState.currentScene;
  if (!scene || !scene.options || scene.options.length === 0) return;

  const modal = document.getElementById('manual-decide-modal');
  const list = document.getElementById('manual-options-list');
  list.innerHTML = '';

  scene.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'manual-option-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      // 选中效果
      list.querySelectorAll('.manual-option-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      // 短暂延迟后确认
      setTimeout(() => {
        confirmManualDecide(opt);
      }, 500);
    });
    list.appendChild(btn);
  });

  modal.style.display = 'flex';
}

function confirmManualDecide(choice) {
  const modal = document.getElementById('manual-decide-modal');
  modal.style.display = 'none';

  const bird = AppState.currentBird;
  const scene = AppState.currentScene;

  // 隐藏决策按钮
  document.getElementById('decide-btn').style.display = 'none';
  document.getElementById('manual-decide-btn').style.display = 'none';

  // 保存结果
  Storage.saveLastResult(scene.id, choice);
  Storage.addHistory({
    scene: scene.name,
    sceneId: scene.id,
    options: scene.options,
    result: choice,
    timestamp: Date.now(),
    bird: bird ? bird.name : '自己',
    manual: true
  });
  AppState.lastResult = choice;

  // 显示结果区
  const resultArea = document.getElementById('result-area');
  resultArea.style.display = 'block';
  resultArea.classList.add('show');
  document.getElementById('result-text').textContent = choice;

  // 生成"傲娇"式理由
  const manualReasons = [
    '你自己选的，可别后悔哦～',
    '看来你心里早就有答案了嘛！',
    '果然还是自己做的决定最安心 ✨',
    '我就知道你其实不需要我 😏',
    '自己选的含着泪也要走完！',
    '恭喜你战胜了选择困难症 🎉',
    '你比自己想象的更有主见呢～',
    '下次犹豫的时候，相信自己的直觉吧'
  ];
  const reason = manualReasons[Math.floor(Math.random() * manualReasons.length)];
  const manualIcon = bird && bird.image 
    ? `<img src="${bird.image}" alt="" style="width:20px;height:20px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:4px;border:2px solid ${bird.color};">`
    : (bird ? bird.emoji : '🤗');
  document.getElementById('result-reason').innerHTML = manualIcon + ' ' + reason;
  document.getElementById('correction-msg').textContent = '';

  // 显示完成按钮
  document.getElementById('reroll-btn').style.display = 'none';
  document.getElementById('done-btn').style.display = '';

  // 雀说话
  if (bird) {
    document.getElementById('bird-speech').textContent = reason;
  }
}

// ===== 历史记录页 =====
function initHistoryPage() {
  renderHistory();
}

function renderHistory() {
  const history = Storage.getHistory();
  const container = document.getElementById('history-list');
  container.innerHTML = '';

  if (history.length === 0) {
    container.innerHTML = '<p class="empty-hint">还没有任何决策历史~</p>';
    return;
  }

  history.forEach(record => {
    const item = document.createElement('div');
    item.className = 'history-item';
    const date = new Date(record.timestamp);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
    // 获取对应雀的图片
    const birdKey = Object.keys(BIRDS).find(k => BIRDS[k].name === record.bird);
    const recordBird = birdKey ? BIRDS[birdKey] : null;
    const historyBirdIcon = recordBird && recordBird.image
      ? `<img src="${recordBird.image}" alt="" style="width:16px;height:16px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:4px;border:1px solid ${recordBird ? recordBird.color : '#ccc'};">`
      : '🐦';
    
    item.innerHTML = `
      <div class="history-scene">${record.scene}${record.manual ? '<span class="history-manual-badge">✋自选</span>' : ''}</div>
      <div class="history-result">→ <strong>${record.result}</strong></div>
      <div class="history-meta">
        <span>${historyBirdIcon} ${record.bird}</span>
        <span>${dateStr}</span>
      </div>
    `;
    container.appendChild(item);
  });
}

// ===== 个人中心 / 登录 =====
let _profileMode = 'login'; // 'login' | 'register'

function initProfilePage() {
  const user = Storage.getUser();
  const loggedInEl = document.getElementById('profile-logged-in');
  const loginFormEl = document.getElementById('profile-login-form');

  if (user) {
    // 已登录：显示个人中心
    if (loggedInEl) loggedInEl.style.display = 'block';
    if (loginFormEl) loginFormEl.style.display = 'none';

    document.getElementById('profile-avatar-display').textContent = user.avatar || '🐦';
    document.getElementById('profile-name-display').textContent = user.username;
    document.getElementById('profile-username-display').textContent = user.username;
    const dateStr = new Date(user.createdAt).toLocaleDateString('zh-CN');
    document.getElementById('profile-date-display').textContent = dateStr;
  } else {
    // 未登录：显示登录表单
    if (loggedInEl) loggedInEl.style.display = 'none';
    if (loginFormEl) loginFormEl.style.display = 'block';

    // 重置为登录模式
    switchProfileTab('login');
    clearLoginErrors();
  }

  updateProfileNavIcon();
}

function switchProfileTab(mode) {
  _profileMode = mode;
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  if (mode === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.style.display = 'block';
    formRegister.style.display = 'none';
  } else {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.style.display = 'block';
    formLogin.style.display = 'none';
  }
  clearLoginErrors();
}

function clearLoginErrors() {
  const loginErr = document.getElementById('login-error');
  const regErr = document.getElementById('reg-error');
  if (loginErr) loginErr.textContent = '';
  if (regErr) regErr.textContent = '';
}

function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  if (!username || !password) {
    errorEl.textContent = '请填写用户名和密码';
    return;
  }

  const user = Storage.getUser();
  if (!user) {
    errorEl.textContent = '还没有账号？请先注册';
    return;
  }

  if (user.username !== username || user.password !== password) {
    errorEl.textContent = '用户名或密码错误';
    return;
  }

  // 登录成功
  user.password = undefined; // 不暴露密码
  initProfilePage();
}

function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('reg-error');

  if (!username) {
    errorEl.textContent = '请输入用户名';
    return;
  }
  if (username.length < 2) {
    errorEl.textContent = '用户名至少2个字';
    return;
  }
  if (!password || password.length < 6) {
    errorEl.textContent = '密码至少6位';
    return;
  }

  // 检查是否已注册
  const existingUser = Storage.getUser();
  if (existingUser && existingUser.username === username) {
    errorEl.textContent = '该用户名已被使用';
    return;
  }

  // 获取选中的头像
  const selectedAvatar = document.querySelector('#avatar-picker .avatar-option.selected');
  const avatar = selectedAvatar ? selectedAvatar.dataset.avatar : '🐦';

  // 保存用户
  const user = {
    username,
    password,
    avatar,
    createdAt: Date.now()
  };
  Storage.saveUser(user);
  user.password = undefined;

  // 清空注册表单
  document.getElementById('reg-username').value = '';
  document.getElementById('reg-password').value = '';

  initProfilePage();
}

function handleLogout() {
  Storage.clearUser();
  document.getElementById('profile-logged-in').style.display = 'none';
  document.getElementById('profile-login-form').style.display = 'block';
  switchProfileTab('login');
  clearLoginErrors();
  // 清空登录表单
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  updateProfileNavIcon();
}

function updateProfileNavIcon() {
  const user = Storage.getUser();
  const icon = document.getElementById('nav-profile-icon');
  if (icon) {
    icon.textContent = user ? (user.avatar || '🐦') : '👤';
  }
}

// ===== 路由监听与初始化 =====

/**
 * 路由变化时的回调处理
 */
function handleRouteChange(route) {
  console.log('[App] 路由变化:', route.name, route.params);
  
  // 更新打赏按钮可见性
  updateSponsorVisibility(route.name);
  
  // 根据路由名称执行相应初始化
  switch (route.name) {
    case 'home':
      // 确保雀已选中
      if (!AppState.currentBird) {
        const savedBirdId = Storage.getBird();
        if (savedBirdId && BIRDS[savedBirdId]) {
          AppState.currentBird = BIRDS[savedBirdId];
          updateBirdDisplay();
        }
      }
      // 刷新场景列表（可能从决策页返回）
      renderBuiltinScenes();
      renderCustomScenes();
      break;
      
    case 'decision':
      initDecisionPage();
      break;
      
    case 'history':
      initHistoryPage();
      break;
      
    case 'profile':
      initProfilePage();
      break;
      
    case 'bird':
      // 选雀页不需要特殊初始化
      break;
  }
}

/**
 * 加载已保存的雀状态
 */
function loadSavedState() {
  const savedBirdId = Storage.getBird();
  if (savedBirdId && BIRDS[savedBirdId]) {
    AppState.currentBird = BIRDS[savedBirdId];
    updateBirdDisplay();
    return true;
  }
  return false;
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  // 防止重复初始化
  if (AppState.isInitialized) return;
  AppState.isInitialized = true;
  
  console.log('[App] 开始初始化...');
  
  // 初始化选雀页
  initBirdSelect();
  
  // 初始化主页
  initMainPage();
  
  // 加载已保存的雀状态
  loadSavedState();
  
  // 初始化路由系统（必须在所有事件绑定之后）
  Router.init();
  
  // 监听路由变化
  window.addEventListener('routeChange', (e) => {
    handleRouteChange(e.detail);
  });
  
  // 首次加载：打赏按钮默认可见，根据当前路由调整
  var curr = Router.getCurrentRoute();
  updateSponsorVisibility(curr ? curr.name : '');
  
  // ===== 绑定事件 =====
  
  // 决策按钮
  document.getElementById('decide-btn').addEventListener('click', onDecideClick);
  document.getElementById('reroll-btn').addEventListener('click', onRerollClick);
  document.getElementById('done-btn').addEventListener('click', onDoneClick);

  // 手动决定按钮
  document.getElementById('manual-decide-btn').addEventListener('click', openManualDecide);
  document.getElementById('manual-decide-cancel').addEventListener('click', () => {
    document.getElementById('manual-decide-modal').style.display = 'none';
  });

  // 选项编辑按钮
  document.getElementById('toggle-edit-options').addEventListener('click', openOptionsEditor);
  document.getElementById('cancel-edit-options').addEventListener('click', () => {
    closeOptionsEditor();
  });
  document.getElementById('save-edit-options').addEventListener('click', saveOptionsEdit);
  document.getElementById('option-add-btn').addEventListener('click', addOptionFromInput);
  document.getElementById('option-add-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addOptionFromInput();
    }
  });
  
  // 底部导航（使用事件委托）
  document.querySelector('.bottom-nav').addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (!navItem) return;
    
    const route = navItem.dataset.route;
    switch (route) {
      case 'home':
        goHome();
        break;
      case 'bird':
        goBirdSelect();
        break;
      case 'history':
        goHistory();
        break;
      case 'profile':
        goProfile();
        break;
    }
  });
  
  // 返回按钮
  document.getElementById('decision-back-btn').addEventListener('click', () => {
    goBack();
  });
  
  document.getElementById('history-back-btn').addEventListener('click', () => {
    goBack();
  });
  
  // 清空历史按钮
  document.getElementById('clear-history-btn').addEventListener('click', () => {
    if (confirm('确定清空所有历史记录？')) {
      Storage.clearHistory();
      renderHistory();
    }
  });
  
  // 重选警告弹窗
  document.getElementById('reroll-warning-close').addEventListener('click', () => {
    document.getElementById('reroll-warning').style.display = 'none';
  });
  document.getElementById('reroll-warning-continue').addEventListener('click', () => {
    document.getElementById('reroll-warning').style.display = 'none';
    // 强制继续重选
    AppState.rerollCount = 0;
    onRerollClick();
  });
  
  // 打赏功能
  document.getElementById('sponsor-float-btn').addEventListener('click', openSponsorModal);
  document.getElementById('sponsor-close').addEventListener('click', closeSponsorModal);
  document.getElementById('sponsor-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      closeSponsorModal();
    }
  });
  
  // ===== 登录/个人中心事件 =====
  // 标签切换
  document.getElementById('tab-login').addEventListener('click', () => switchProfileTab('login'));
  document.getElementById('tab-register').addEventListener('click', () => switchProfileTab('register'));
  
  // 头像选择器
  document.getElementById('avatar-picker').addEventListener('click', (e) => {
    const option = e.target.closest('.avatar-option');
    if (!option) return;
    document.querySelectorAll('#avatar-picker .avatar-option').forEach(o => o.classList.remove('selected'));
    option.classList.add('selected');
  });
  
  // 登录提交
  document.getElementById('login-submit-btn').addEventListener('click', handleLogin);
  document.getElementById('login-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  
  // 注册提交
  document.getElementById('reg-submit-btn').addEventListener('click', handleRegister);
  document.getElementById('reg-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
  
  // 退出登录
  document.getElementById('profile-logout-btn').addEventListener('click', handleLogout);
  
  // 更新导航图标
  updateProfileNavIcon();
  
  console.log('[App] 初始化完成!');
});
