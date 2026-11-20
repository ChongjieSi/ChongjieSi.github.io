/* Shared game metadata and browser-local score store. No network service required. */
window.Arcade = (() => {
  const categoryNames = {PUZZLE:'益智', STRATEGY:'策略', CLASSIC:'经典', ACTION:'动作', '3D':'3D 世界'};
  const games = [
    {id:'2048',name:'数字合成 2048',symbol:'2048',tag:'PUZZLE',color:'#d99239',description:'滑动、合并，向下一个更大的数字进发。',controls:'方向键 / WASD 或滑动操作。每次移动，相同数字只能合并一次。',rule:'每次合并获得合成数字对应的分数，达到 2048 后可继续挑战。'},
    {id:'gomoku',name:'五子棋',symbol:'● ○',tag:'STRATEGY',color:'#708c69',description:'你执黑先行，与电脑展开一场十五路对弈。',controls:'点击 15 × 15 棋盘的交叉点落子。你执黑，电脑执白。',rule:'获胜得 1,000 分，另加每个空位 20 分；和棋 500 分；落败 0 分。采用自由规则，五子或以上连线即胜。'},
    {id:'memory',name:'记忆翻牌',symbol:'✦',tag:'PUZZLE',color:'#a581c9',description:'36 张卡片、18 对图案，考验你的记忆。',controls:'每次翻开两张卡片，在 6 × 6 牌阵中找齐 18 对相同图案。',rule:'得分 = 6,000 − 尝试次数 × 50 − 用时秒数 × 5，最低 100 分。'},
    {id:'tetris',name:'俄罗斯方块',symbol:'▟',tag:'CLASSIC',color:'#6589d4',description:'在不断落下的方块之间，找到自己的节奏。',controls:'← → 移动 · ↑ / X 旋转 · ↓ 加速 · 空格直接落下 · P 暂停。也可使用下方按钮。',rule:'一次消除 1 / 2 / 3 / 4 行，得 100 / 300 / 500 / 800 分再乘等级。主动下落另有加分。'},
    {id:'snake',name:'贪吃蛇',symbol:'〰',tag:'CLASSIC',color:'#58a396',description:'多吃一口，转身的余地就少一点。',controls:'方向键 / WASD、滑动或下方按钮控制方向。不要撞墙或碰到自己的身体。',rule:'每吃一个苹果得 100 分，身体越长，移动越快。'},
    {id:'breakout',name:'霓虹打砖块',symbol:'◒',tag:'ACTION',color:'#d275a2',description:'从星环迷阵出发，挑战变化的砖阵与装甲砖。',controls:'鼠标、触摸或 ← → 移动挡板。三次生命，清空砖块后进入新的阵型。砖上的方点表示剩余耐久。',rule:'击碎砖块得 100 × 关卡 × 初始耐久分，清关另得 500 × 关卡分。每升一关球速增加 52 像素/秒，并逐步加入变化阵型和装甲砖。'},
    {id:'mines',name:'扫雷',symbol:'✳',tag:'STRATEGY',color:'#7185a1',description:'解读数字线索，排查十二路雷区。',controls:'点击翻开，右键插旗；触屏可使用「插旗模式」。第一次翻开的位置及其邻域安全。',rule:'排完全部安全格得 10,000 − 用时秒数 × 10 分，最低 100 分。触雷得 0 分。'},
    {id:'stack3d',name:'3D 方块叠塔',symbol:'▱',tag:'3D',color:'#8a79d6',description:'在云端搭起彩色高塔，让每一次落点恰到好处。',controls:'点击立体场景、按空格或点击「落下方块」。方块沿两个方向交替移动，超出底座的部分会被切掉。',rule:'每叠一层得 100 分；完美对齐额外获得 50 × 连续完美次数分。完全错开则结束。'},
    {id:'flight3d',name:'3D 星际穿梭',symbol:'◇',tag:'3D',color:'#4f9fb7',description:'穿过发光星门，在立体航道里躲开陨石。',controls:'方向键 / WASD 持续转向，或在画面上拖动瞄准。飞船自动前进，穿过蓝色星门的中心并避开红色陨石；三次护盾机会。',rule:'每穿过一道星门得 250 分，连续命中有加成。飞行距离也会计分，速度随航程提升。漏过星门或撞到陨石会消耗一格护盾。'},
    {id:'city3d',name:'3D 海岸城',symbol:'▥',tag:'3D',color:'#699f98',description:'走进每栋建筑，漫游湖畔公园与林海溪谷。',controls:'WASD / 方向键移动和驾驶；Shift 奔跑；空格手刹；H 鸣笛；R 返回车站。拖动画面环顾，滚轮调整距离；触屏使用方向按钮。靠近车门或建筑入口按 E：拦停换车、进屋探索、阅读手记，或使用电梯选择楼层。门口按 E 返回城市。M 打开地图：点击建筑或搜索门牌导航，选择海湾公园、林海溪谷、山顶观景台，选择高架东、西入口导航驶上高架，或沿弯曲大道探索山脊隧道；「昼夜」切换夜景。地图中还可接取接送与咖啡配送、海滩探访、体育场训练及两场驾驶计时赛。车辆受损可到西城车站检修，登塔后可从「观景厅」进入室内。点击「结束漫游」填写昵称并提交成绩。',rule:'首次进入建筑 100 分，首次阅读各房间手记 60 分，首次探索自然景点 300 分。城市委托按评价与剩余时间计分，每三单完美服务额外奖励 600 分；快递 750 分，城市印记 100 分，首次发现街区 150 分；地标、展品、海滩与体育场另有奖励。计时赛碰撞罚时 2 秒，重复挑战只追加最佳成绩的提升分。重复查看不重复加分，自由漫游没有时间限制，成绩与最佳用时保存在当前浏览器。'}
  ];
  const key = 'chongjie-arcade-scores-v1';
  const read = () => { try { const data=JSON.parse(localStorage.getItem(key)||'[]'); return Array.isArray(data)?data.filter(r=>games.some(g=>g.id===r.game)&&typeof r.name==='string'&&Number.isFinite(r.score)&&r.score>=0):[]; } catch {return [];} };
  const scores = id => read().filter(r=>r.game===id).sort((a,b)=>b.score-a.score || a.date-b.date).slice(0,10);
  const submit = (game,name,score) => {
    const rows=read(); rows.push({game,name:name.trim().slice(0,20),score:Math.floor(score),date:Date.now()});
    const kept=games.flatMap(g=>rows.filter(r=>r.game===g.id).sort((a,b)=>b.score-a.score||a.date-b.date).slice(0,10));
    localStorage.setItem(key,JSON.stringify(kept));
    try {localStorage.setItem('chongjie-arcade-name',name.trim().slice(0,20));} catch {}
  };
  const nickname=()=>{try{return localStorage.getItem('chongjie-arcade-name')||'';}catch{return '';}};
  return {games,categoryNames,scores,submit,nickname,key};
})();
