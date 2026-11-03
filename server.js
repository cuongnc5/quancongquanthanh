const express = require('express');

const http = require('http');

const path = require('path');

const fs = require('fs');

const { spawn } = require('child_process');

const cors = require('cors');

const { WebSocketServer } = require('ws');

const { TikTokLiveConnection, WebcastEvent, ControlEvent } = require('tiktok-live-connector');

const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');

const TTS_CACHE_DIR = path.join(DATA_DIR, 'tts-cache');

const STATE_FILE = path.join(DATA_DIR, 'merit-state.json');

fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });

// ============================================================================

// 1. BỘ 18 QUẺ LINH XĂM MIẾU QUAN CÔNG (FORTUNE STICKS DECK)

// ============================================================================

const FORTUNE_DECK = [

  {

    number: 1,

    rank: 'Thượng Thượng Cát',

    title: 'Nhật Xuất Đông Phương — Mặt Trời Mọc Phương Đông',

    poem: 'Đông phương nhật xuất chiếu Càn Khôn\nHoa nở đầy cành rạng sắc xuân\nCông danh tài lộc đều viên mãn\nGia đạo bình an phúc lộc tồn.',

    meaning: 'Mọi sự mưu cầu đều đại cát đại lợi. Công việc hanh thông, quý nhân phù trợ, gia đình hòa thuận ấm êm.',

    ttsSummary: 'Quẻ số 1, Thượng Thượng Cát, Nhật Xuất Đông Phương. Mọi sự mưu cầu đều đại cát đại lợi, công danh tài lộc viên mãn, quý nhân phù trợ.'

  },

  {

    number: 8,

    rank: 'Thượng Cát',

    title: 'Cờ Nghĩa Tung Bay — Uy Danh Rạng Rỡ',

    poem: 'Cờ nghĩa tung bay giữa trời trong\nHương trầm lan tỏa khắp non sông\nLòng thành thắp nén nhang cầu nguyện\nQuan Thánh chứng giám thỏa ước mong.',

    meaning: 'Giữ lòng chính trực, trọng chữ tín thì việc cầu tài, cầu bình an đều có cơ hội thuận thành.',

    ttsSummary: 'Quẻ số 8, Thượng Cát, Cờ Nghĩa Tung Bay. Giữ lòng chính trực, trọng chữ tín thì tài lộc và bình an đều thuận thành.'

  },

  {

    number: 12,

    rank: 'Đại Cát',

    title: 'Long Vân Tương Hội — Rồng Mây Gặp Gỡ',

    poem: 'Rồng thiêng gặp hội tầng mây xanh\nVượt Vũ Môn Quan rạng rỡ danh\nThiện tín kiên tâm giữ chính nghĩa\nPhúc dày lộc vượng khắp gia đình.',

    meaning: 'Thời vận đang lên mạnh mẽ. Thi cử đỗ đạt, kinh doanh phát đạt, gặp cơ hội lớn đổi đời.',

    ttsSummary: 'Quẻ số 12, Đại Cát, Long Vân Tương Hội. Thời vận đang lên mạnh mẽ, thi cử đỗ đạt, kinh doanh phát đạt.'

  },

  {

    number: 18,

    rank: 'Thượng Cát',

    title: 'Xuân Phong Đắc Ý — Gió Xuân Thuận Buồm',

    poem: 'Thuận buồm xuôi gió vượt trùng khơi\nChính đạo vững vàng nắng rạng ngời\nTài lộc dồi dào nhân duyên tốt\nBốn mùa hưng thịnh rộn niềm vui.',

    meaning: 'Đi xa gặp may, buôn bán thuận lợi, tình duyên êm đẹp, người thân mạnh khỏe.',

    ttsSummary: 'Quẻ số 18, Thượng Cát, Xuân Phong Đắc Ý. Thuận buồm xuôi gió, tài lộc dồi dào, nhân duyên tốt đẹp.'

  },

  {

    number: 24,

    rank: 'Trung Cát',

    title: 'Vũ Quá Thiên Thanh — Mưa Tạnh Trời Trong',

    poem: 'Mưa qua trời lại sáng trong ngần\nGian khó lùi xa đón phúc phần\nGiữ vững lòng thành đừng nản chí\nHoa thơm trái ngọt đến mười phân.',

    meaning: 'Khó khăn cũ sắp qua đi, vận may mới đang tới. Hãy kiên nhẫn và giữ tâm bình tĩnh.',

    ttsSummary: 'Quẻ số 24, Trung Cát, Vũ Quá Thiên Thanh. Mưa qua trời lại sáng trong, gian khó lùi xa để đón phúc phần mới.'

  },

  {

    number: 36,

    rank: 'Thượng Thượng Cát',

    title: 'Phúc Tinh Cao Chiếu — Sao Phúc Chiếu Mệnh',

    poem: 'Phúc tinh rực sáng giữa đêm rằm\nQuan Thánh soi đường suốt quanh năm\nTài lộc tự nhiên về gõ cửa\nTrăm điều như ý vạn điều lành.',

    meaning: 'Sao Phúc chiếu mạng, tai qua nạn khỏi, tiền tài sung túc, gia đạo hưng long.',

    ttsSummary: 'Quẻ số 36, Thượng Thượng Cát, Phúc Tinh Cao Chiếu. Sao Phúc chiếu mạng, tài lộc tự nhiên gõ cửa, trăm điều như ý.'

  },

  {

    number: 52,

    rank: 'Thượng Cát',

    title: 'Ngọc Xuất Côn Sơn — Ngọc Quý Phát Sáng',

    poem: 'Ngọc quý Côn Sơn tỏa ánh ngời\nBấy lâu rèn giũa nay gặp thời\nTri âm tương ngộ cùng nâng đỡ\nSự nghiệp thăng hoa rạng rỡ đời.',

    meaning: 'Nỗ lực bấy lâu nay sắp được đền đáp xứng đáng. Có người tốt nâng đỡ trong công việc và cuộc sống.',

    ttsSummary: 'Quẻ số 52, Thượng Cát, Ngọc Xuất Côn Sơn. Nỗ lực bấy lâu sắp được đền đáp xứng đáng, sự nghiệp thăng hoa.'

  },

  {

    number: 68,

    rank: 'Đại Cát',

    title: 'Lộc Mã Đồng Hương — Lộc Tài Cùng Tới',

    poem: 'Lộc Mã song hành đến tận nhà\nLàm ăn buôn bán nở như hoa\nGiữ tròn tín nghĩa thêm uy tín\nPhú quý vinh hoa khắp một nhà.',

    meaning: 'Quẻ đại lợi về tài lộc và kinh doanh. Giữ chữ tín, làm ăn chính trực thì cơ nghiệp càng bền vững.',

    ttsSummary: 'Quẻ số 68, Đại Cát, Lộc Mã Đồng Hương. Đại lợi về tài lộc và buôn bán; giữ chữ tín thì cơ nghiệp bền vững.'

  },

  {

    number: 81,

    rank: 'Thượng Cát',

    title: 'Nguyệt Nhập Trung Thiên — Trăng Rằm Giữa Đỉnh',

    poem: 'Trăng tròn vằng vặc giữa trời thu\nSoi sáng muôn phương sạch mây mù\nTình duyên viên mãn gia đình thuận\nTâm an vạn sự chẳng ưu tư.',

    meaning: 'Tình duyên và gia đạo vô cùng tốt đẹp. Người độc thân dễ gặp ý trung nhân, gia đình thêm tin vui.',

    ttsSummary: 'Quẻ số 81, Thượng Cát, Nguyệt Nhập Trung Thiên. Tình duyên viên mãn, gia đình hòa thuận, tâm an vạn sự lành.'

  },

  {

    number: 99,

    rank: 'Thượng Thượng Cát',

    title: 'Vạn Sự Viên Thành — Cửu Cửu Đại Cát',

    poem: 'Chín tầng mây trắng ánh hào quang\nQuan Thánh uy linh độ thế gian\nThiện tín lòng thành dâng lễ bái\nTrọn đời trường thọ hưởng vinh khang.',

    meaning: 'Quẻ tối thượng cát tường. Sức khỏe trường thọ, công danh hiển đạt, vạn sự viên thành.',

    ttsSummary: 'Quẻ số 99, Thượng Thượng Cát, Vạn Sự Viên Thành. Quẻ tối thượng cát tường, sức khỏe trường thọ, vạn sự như ý.'

  }

];

// ============================================================================

// 2. ZEROTTS PYTHON WORKER MANAGER (VOICE: MAI CHI)

// ============================================================================

class ZeroTTSManager {

  constructor() {

    this.proc = null;

    this.ready = false;

    this.status = 'starting';

    this.voice = 'maichi';

    this.voices = ['maichi'];

    this.model = 'zeroweight-ai/ZeroTTS';

    this.pending = new Map();

    this.inflight = new Map();

    this.maxPending = 8;

    this.reqCounter = 0;

    this.buffer = '';

    this.startWorker();

  }

  resolvePythonBin() {

    const venvPy = path.join(__dirname, '.venv', 'bin', 'python');

    if (fs.existsSync(venvPy)) return venvPy;

    return 'python3';

  }

  startWorker() {

    const pyBin = this.resolvePythonBin();

    const scriptPath = path.join(__dirname, 'tts_worker.py');

    console.log(`[ZeroTTS] Khởi chạy worker với ${pyBin} (Giọng mặc định: Mai Chi)...`);

    this.status = 'loading';

    this.proc = spawn(pyBin, [scriptPath], {

      cwd: __dirname,

      stdio: ['pipe', 'pipe', 'pipe']

    });

    this.proc.stdout.on('data', (chunk) => {

      this.buffer += chunk.toString('utf8');

      let lines = this.buffer.split('\n');

      this.buffer = lines.pop() || '';

      for (const line of lines) {

        if (!line.trim()) continue;

        this.handleWorkerLine(line.trim());

      }

    });

    this.proc.stderr.on('data', (chunk) => {

      const msg = chunk.toString('utf8').trim();

      if (msg) console.log(`[ZeroTTS stderr] ${msg}`);

    });

    this.proc.on('exit', (code) => {

      console.warn(`[ZeroTTS] Worker thoát với mã ${code}`);

      this.ready = false;

      this.status = 'stopped';

      for (const [, item] of this.pending) {

        clearTimeout(item.timer);

        item.resolve({ ok: false, error: 'ZeroTTS worker exited' });

      }

      this.pending.clear();

    });

  }

  handleWorkerLine(line) {

    try {

      const msg = JSON.parse(line);

      if (msg.type === 'status') {

        this.status = msg.status;

        this.model = msg.model || this.model;

        broadcastNotification('tts.status', this.getStatus());

      } else if (msg.type === 'ready') {

        this.ready = true;

        this.status = 'ready';

        this.voice = msg.voice || 'maichi';

        this.voices = msg.voices || ['maichi'];

        this.model = msg.model || this.model;

        console.log(`[ZeroTTS] Sẵn sàng sau ${msg.loadSec}s! Giọng: \({this.voice} (\){this.voices.join(', ')})`);

        broadcastNotification('tts.status', this.getStatus());

      } else if (msg.type === 'result' && msg.id != null) {

        const entry = this.pending.get(msg.id);

        if (entry) {

          clearTimeout(entry.timer);

          this.pending.delete(msg.id);

          entry.resolve(msg);

        }

      } else if (msg.type === 'error') {

        console.error('[ZeroTTS Error]', msg.error);

        this.status = 'error';

        broadcastNotification('tts.status', this.getStatus());

      }

    } catch (err) {

      console.log('[ZeroTTS stdout]', line);

    }

  }

  getStatus() {

    return {

      ready: this.ready,

      status: this.status,

      engine: 'ZeroTTS (zeroweight-ai/ZeroTTS)',

      voice: state.settings.ttsVoice || this.voice || 'maichi',

      voices: this.voices,

      model: this.model

    };

  }

  synthesize(text, voiceOverride) {

    const cleanText = String(text || '').trim();

    if (!cleanText) return Promise.resolve({ ok: false, error: 'Empty text' });

    if (this.pending.size >= this.maxPending) {
      return Promise.resolve({ ok: false, skipped: true, error: 'TTS queue is busy' });
    }

    const voice = (voiceOverride || state.settings.ttsVoice || 'maichi').toLowerCase();

    const dedupKey = `\({voice}::\){cleanText}`;

    if (this.inflight.has(dedupKey)) {

      return this.inflight.get(dedupKey);

    }

    const promise = new Promise((resolve) => {

      if (!this.proc || !this.ready) {

        return resolve({ ok: false, error: `ZeroTTS đang ở trạng thái: ${this.status}` });

      }

      const id = ++this.reqCounter;

      const timer = setTimeout(() => {

        this.pending.delete(id);

        resolve({ ok: false, error: 'ZeroTTS synthesis timeout' });

      }, 30000);

      this.pending.set(id, { resolve, timer });

      const payload = JSON.stringify({ id, text: cleanText, voice }) + '\n';

      this.proc.stdin.write(payload);

    }).finally(() => {

      this.inflight.delete(dedupKey);

    });

    this.inflight.set(dedupKey, promise);

    return promise;

  }

}

// ============================================================================

// 3. TRẠNG THÁI MIẾU QUAN CÔNG & BẢNG VÀNG CÔNG ĐỨC

// ============================================================================

const DEFAULT_STATE = {

  totalIncense: 108,

  totalMerit: 1080,

  woodenFishHits: 360,

  bellRings: 36,

  lanternCount: 18,

  fortuneCount: 12,

  activeIncenseSticks: 9,

  haloIntensity: 0.45,

  offerings: {

    lotus: 3,

    fruit: 2,

    lamp: 2,

    dragon: 1

  },

  devotees: {},

  recentEvents: [],

  settings: {

    ttsEnabled: true,

    ttsVoice: 'maichi',

    bgMusicEnabled: true,

    sfxEnabled: true,

    smokeDensity: 1.0,

    autoSim: false,

    autoSimIntervalMs: 7200

  },

  tiktok: {

    connected: false,

    connecting: false,

    username: 'zenfacts_vn',

    roomId: null,

    viewerCount: 0,

    lastError: null

  }

};

function loadState() {

  try {

    if (fs.existsSync(STATE_FILE)) {

      const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

      return {

        ...DEFAULT_STATE,

        ...saved,

        devotees: saved.devotees || {},

        offerings: { ...DEFAULT_STATE.offerings, ...(saved.offerings || {}) },

        settings: { ...DEFAULT_STATE.settings, ...(saved.settings || {}) },

        tiktok: { ...DEFAULT_STATE.tiktok }

      };

    }

  } catch (e) {

    console.warn('[State] Không đọc được merit-state.json, dùng mặc định:', e.message);

  }

  return JSON.parse(JSON.stringify(DEFAULT_STATE));

}

let state = loadState();

const MAX_DEVOTEES = 800;

function pruneDevotees() {
  const entries = Object.entries(state.devotees);
  if (entries.length <= MAX_DEVOTEES) return;
  entries
    .sort(([, a], [, b]) => (a.merit || 0) - (b.merit || 0))
    .slice(0, entries.length - MAX_DEVOTEES)
    .forEach(([key]) => delete state.devotees[key]);
}

let saveTimer = null;

function saveState() {

  clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {

    const toSave = {

      totalIncense: state.totalIncense,

      totalMerit: state.totalMerit,

      woodenFishHits: state.woodenFishHits,

      bellRings: state.bellRings,

      lanternCount: state.lanternCount,

      fortuneCount: state.fortuneCount,

      activeIncenseSticks: state.activeIncenseSticks,

      offerings: state.offerings,

      devotees: state.devotees,

      settings: state.settings

    };

    fs.promises.writeFile(STATE_FILE, JSON.stringify(toSave, null, 2), 'utf8').catch((e) => {

      console.error('[State] Lỗi lưu file:', e.message);

    });

  }, 1200);

}

function getLeaderboard(limit = 6) {

  return Object.values(state.devotees)

    .sort((a, b) => b.merit - a.merit)

    .slice(0, limit)

    .map((d, index) => ({

      rank: index + 1,

      name: d.name,

      uniqueId: d.uniqueId,

      avatar: d.avatar || '',

      merit: d.merit,

      incense: d.incense || 0,

      lastWish: d.lastWish || ''

    }));

}

// Bộ lọc chặn ký tự lạ (Cuneiform 𒐫, Zalgo, Braille, ký tự spam) & từ ngữ phản cảm

const WEIRD_SPAM_RE = /[\u{12000}-\u{1254F}\uFDFD\u2800-\u28FF\u2580-\u259F]|[\u0300-\u036F]{3,}/u;

const BRACKET_EMOTE_RE = /\[[^\]]{1,24}\]/g;

const ALLOWED_VI_TEXT_RE = /[^0-9a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ\s.,!?]/g;

const ALLOWED_VI_NAME_RE = /[^0-9a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ\s._-]/g;

const VI_LETTER_RE = /[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/g;

const BAD_WORDS_RE = /(đá dái|địt|lồn|cặc|đm|vcl|vl|yamate|i cư|lừa đảo|lừa à|te-le gram|telegram|bố là trùm)/i;

const LEGACY_BUDDHIST_PHRASE_RE = /\b(?:nam\s+m(?:ô|o)\s+)?a\s*di\s*(?:đà|da)\s*ph(?:ật|at)\b/giu;

const QUAN_CONG_INVOCATION = 'Kính bái Quan Thánh Đế Quân';

function normalizeQuanCongInvocation(rawText) {

  return String(rawText || '').replace(LEGACY_BUDDHIST_PHRASE_RE, QUAN_CONG_INVOCATION);

}

function isBlockedSpamOrToxic(raw) {

  if (!raw) return true;

  const s = String(raw);

  if (WEIRD_SPAM_RE.test(s)) return true;

  if (BAD_WORDS_RE.test(s)) return true;

  return false;

}

function sanitizeUserName(rawName) {

  const normalized = String(rawName || '')

    .normalize('NFKC')

    .normalize('NFC')

    .replace(BRACKET_EMOTE_RE, ' ')

    .replace(ALLOWED_VI_NAME_RE, ' ')

    .replace(/(.)\1{3,}/gi, '$1$1')

    .replace(/\s+/g, ' ')

    .trim()

    .slice(0, 26);

  if (!normalized || BAD_WORDS_RE.test(normalized)) {

    return 'Thiện Tín Hữu Duyên';

  }

  const letters = normalized.match(VI_LETTER_RE) || [];

  if (letters.length < 2) {

    return 'Thiện Tín Hữu Duyên';

  }

  return normalized;

}

function sanitizeWishText(rawWish) {

  if (!rawWish) return '';

  const cleaned = normalizeQuanCongInvocation(rawWish)

    .normalize('NFKC')

    .normalize('NFC')

    .replace(BRACKET_EMOTE_RE, ' ')

    .replace(ALLOWED_VI_TEXT_RE, ' ')

    .replace(/([.,!?])\1+/g, '$1')

    .replace(/(.)\1{2,}/gi, '$1$1')

    .replace(/\s+/g, ' ')

    .replace(/^[.,!?\s-]+|[.,!?\s-]+$/g, '')

    .slice(0, 120);

  if (!cleaned || BAD_WORDS_RE.test(cleaned)) return '';

  const letters = cleaned.match(VI_LETTER_RE) || [];

  if (letters.length < 2) return '';

  return cleaned;

}

function recordDevotee(user, uniqueId, avatar, meritDelta, incenseDelta = 0, giftDelta = 0, wish = '') {

  const displayName = sanitizeUserName(user || uniqueId);

  const cleanWish = sanitizeWishText(wish);

  const key = (uniqueId || displayName).slice(0, 40);

  if (!state.devotees[key]) {

    state.devotees[key] = {

      name: displayName,

      uniqueId: uniqueId || displayName.toLowerCase().replace(/\s+/g, ''),

      avatar: avatar || '',

      merit: 0,

      incense: 0,

      gifts: 0,

      lastWish: ''

    };

  }

  const dev = state.devotees[key];

  dev.name = displayName;

  if (avatar) dev.avatar = avatar;

  dev.merit += meritDelta;

  dev.incense += incenseDelta;

  dev.gifts += giftDelta;

  if (cleanWish) dev.lastWish = cleanWish;

  pruneDevotees();

  state.totalMerit += meritDelta;

  state.haloIntensity = Math.min(1.0, 0.35 + (state.totalMerit % 1000) / 1400);

  return dev;

}

function pushEventLog(evt) {

  const entry = {

    id: `evt_\({Date.now()}\_\){Math.random().toString(36).slice(2, 6)}`,

    timestamp: new Date().toISOString(),

    ...evt

  };

  state.recentEvents.unshift(entry);

  if (state.recentEvents.length > 35) {

    state.recentEvents.length = 35;

  }

  return entry;

}

function getPublicState() {

  return {

    totalIncense: state.totalIncense,

    totalMerit: state.totalMerit,

    woodenFishHits: state.woodenFishHits,

    bellRings: state.bellRings,

    lanternCount: state.lanternCount,

    fortuneCount: state.fortuneCount,

    activeIncenseSticks: state.activeIncenseSticks,

    haloIntensity: state.haloIntensity,

    offerings: state.offerings,

    leaderboard: getLeaderboard(24),

    recentEvents: state.recentEvents.slice(0, 15),

    settings: state.settings,

    tiktok: state.tiktok,

    tts: zeroTts ? zeroTts.getStatus() : { ready: false, status: 'init', voice: 'maichi' }

  };

}

// ============================================================================

// 4. NGHI THỨC TƯƠNG TÁC (RITUAL HANDLERS)

// ============================================================================

const Rituals = {

  burnIncense(params = {}) {

    const user = sanitizeUserName(params.user);

    const uniqueId = params.uniqueId || '';

    const avatar = params.avatar || '';

    const count = Math.max(1, Math.min(9, Number(params.count) || 3));

    const wish = sanitizeWishText(params.wish) || 'Con thành tâm dâng hương, cầu gia đình mạnh khỏe, bình an, công việc thuận lợi, làm ăn phát đạt';

    const merit = count * 5;

    state.totalIncense += count;

    state.activeIncenseSticks = Math.min(36, state.activeIncenseSticks + count);

    const devotee = recordDevotee(user, uniqueId, avatar, merit, count, 0, wish);

    const ttsText = params.readTts === false

      ? ''

      : `Kính lễ Quan Thánh Đế Quân. Tín chủ ${devotee.name} thành tâm dâng ${count} nén hương. ${wish}.`;

    const event = pushEventLog({

      type: 'burnIncense',

      user: devotee.name,

      uniqueId: devotee.uniqueId,

      avatar: devotee.avatar,

      count,

      merit,

      wish,

      ttsText,

      ttsVoice: state.settings.ttsVoice || 'maichi'

    });

    saveState();

    broadcastTempleEvent(event);

    return { event, state: getPublicState() };

  },

  strikeWoodenFish(params = {}) {

    const user = sanitizeUserName(params.user);

    const uniqueId = params.uniqueId || '';

    const avatar = params.avatar || '';

    const count = Math.max(1, Math.min(50, Number(params.count) || 1));

    const merit = count;

    state.woodenFishHits += count;

    const devotee = recordDevotee(user, uniqueId, avatar, merit, 0, 0);

    const event = pushEventLog({

      type: 'strikeWoodenFish',

      user: devotee.name,

      uniqueId: devotee.uniqueId,

      avatar: devotee.avatar,

      count,

      merit,

      ttsText: params.ttsText || ''

    });

    saveState();

    broadcastTempleEvent(event);

    return { event, state: getPublicState() };

  },

  ringBell(params = {}) {

    const user = sanitizeUserName(params.user);

    const uniqueId = params.uniqueId || '';

    const avatar = params.avatar || '';

    const count = Math.max(1, Math.min(9, Number(params.count) || 1));

    const wish = sanitizeWishText(params.wish) || 'Cầu cho gia đình bình an, sức khỏe dồi dào, gặp nhiều may mắn, công việc suôn sẻ';

    const merit = count * 10;

    state.bellRings += count;

    const devotee = recordDevotee(user, uniqueId, avatar, merit, 0, 0, wish);

    const ttsText = params.readTts

      ? `Thiện tín ${devotee.name} thành tâm thỉnh chuông miếu: ${wish}.`

      : '';

    const event = pushEventLog({

      type: 'ringBell',

      user: devotee.name,

      uniqueId: devotee.uniqueId,

      avatar: devotee.avatar,

      count,

      merit,

      wish,

      ttsText,

      ttsVoice: state.settings.ttsVoice || 'maichi'

    });

    saveState();

    broadcastTempleEvent(event);

    return { event, state: getPublicState() };

  },

  sendPrayer(params = {}) {

    const user = sanitizeUserName(params.user);

    const uniqueId = params.uniqueId || '';

    const avatar = params.avatar || '';

    const wish = sanitizeWishText(params.wish) || 'Con xin cầu gia đình êm ấm, công việc thuận lợi, làm ăn chân chính, mọi sự tốt lành';

    const merit = 10;

    state.lanternCount += 1;

    const devotee = recordDevotee(user, uniqueId, avatar, merit, 1, 0, wish);

    const ttsText = params.readTts === false

      ? ''

      : `Tín chủ ${devotee.name} thành tâm cầu nguyện trước Quan Công. ${wish}.`;

    const event = pushEventLog({

      type: 'sendPrayer',

      user: devotee.name,

      uniqueId: devotee.uniqueId,

      avatar: devotee.avatar,

      wish,

      merit,

      ttsText,

      ttsVoice: state.settings.ttsVoice || 'maichi'

    });

    saveState();

    broadcastTempleEvent(event);

    return { event, state: getPublicState() };

  },

  offerGift(params = {}) {

    const user = sanitizeUserName(params.user);

    const uniqueId = params.uniqueId || '';

    const avatar = params.avatar || '';

    const coins = Math.max(1, Number(params.coins) || 10);

    const giftType = ['lotus', 'fruit', 'lamp', 'dragon'].includes(params.giftType)

      ? params.giftType

      : (coins >= 100 ? 'dragon' : coins >= 20 ? 'fruit' : coins >= 5 ? 'lamp' : 'lotus');

    const giftLabels = {

      lotus: 'Đài Hoa Sen Vàng',

      fruit: 'Mâm Ngũ Quả Cát Tường',

      lamp: 'Đèn Lưu Ly Trí Tuệ',

      dragon: 'Đại Lễ Kim Long Chầu Quan Thánh'

    };

    const giftName = params.giftName || giftLabels[giftType];

    const multiplier = coins >= 100 ? 50 : coins >= 10 ? 30 : 20;

    const merit = Math.max(20, coins * multiplier);

    state.offerings[giftType] = (state.offerings[giftType] || 0) + 1;

    state.totalIncense += 3;

    state.activeIncenseSticks = Math.min(36, state.activeIncenseSticks + 3);

    const wish = params.wish || `Thành tâm dâng ${giftName} kính Quan Thánh Đế Quân`;

    const devotee = recordDevotee(user, uniqueId, avatar, merit, 3, 1, wish);

    const ttsText = params.readTts === false

      ? ''

      : `Tín chủ ${devotee.name} thành tâm dâng ${giftName} trước Quan Công. Cầu gia đình bình an, làm ăn thuận lợi, gặp nhiều may mắn.`;

    const event = pushEventLog({

      type: giftType === 'dragon' ? 'grandCeremony' : 'offerGift',

      user: devotee.name,

      uniqueId: devotee.uniqueId,

      avatar: devotee.avatar,

      giftType,

      giftName,

      coins,

      merit,

      wish,

      ttsText,

      ttsVoice: state.settings.ttsVoice || 'maichi'

    });

    saveState();

    broadcastTempleEvent(event);

    return { event, state: getPublicState() };

  },

  drawFortune(params = {}) {

    const user = sanitizeUserName(params.user);

    const uniqueId = params.uniqueId || '';

    const avatar = params.avatar || '';

    const topic = sanitizeWishText(params.topic) || 'Gia đạo, Tài lộc và Bình an';

    const fortune = FORTUNE_DECK[Math.floor(Math.random() * FORTUNE_DECK.length)];

    const merit = 10;

    state.fortuneCount += 1;

    const devotee = recordDevotee(user, uniqueId, avatar, merit, 0, 0, `Xin xăm: Quẻ số \({fortune.number} (\){fortune.rank})`);

    const ttsText = params.readTts === false

      ? ''

      : `Thiện tín ${devotee.name} vừa thỉnh được ${fortune.ttsSummary}`;

    const event = pushEventLog({

      type: 'drawFortune',

      user: devotee.name,

      uniqueId: devotee.uniqueId,

      avatar: devotee.avatar,

      topic,

      fortune,

      merit,

      ttsText,

      ttsVoice: state.settings.ttsVoice || 'maichi'

    });

    saveState();

    broadcastTempleEvent(event);

    return { event, state: getPublicState() };

  },

  grandCeremony(params = {}) {

    return this.offerGift({

      ...params,

      giftType: 'dragon',

      coins: Math.max(100, Number(params.coins) || 199),

      giftName: params.giftName || 'Đại Lễ Hào Quang Vạn Trượng'

    });

  },

  updateSettings(params = {}) {

    state.settings = {

      ...state.settings,

      ...params

    };

    if (typeof params.autoSim === 'boolean') {

      configureAutoSim(params.autoSim);

    }

    saveState();

    broadcastNotification('temple.state');

    return getPublicState();

  },

  resetMerit() {

    state.totalIncense = 9;

    state.totalMerit = 0;

    state.woodenFishHits = 0;

    state.bellRings = 0;

    state.lanternCount = 0;

    state.fortuneCount = 0;

    state.activeIncenseSticks = 3;

    state.offerings = { lotus: 1, fruit: 1, lamp: 1, dragon: 0 };

    state.devotees = {};

    state.recentEvents = [];

    saveState();

    broadcastNotification('temple.state');

    return getPublicState();

  }

};

// ============================================================================

// 5. TIKTOK LIVE CONNECTOR & COMMENT PARSER

// ============================================================================

let tiktokConn = null;

const commentCooldownMap = new Map();

function parseViewerComment(commentText, user, uniqueId, avatar) {

  const raw = String(commentText || '').trim();

  if (!raw || isBlockedSpamOrToxic(raw)) {

    return null;

  }

  const cleanWish = sanitizeWishText(raw);

  if (!cleanWish || cleanWish.length < 3) {

    return null;

  }

  // Chống 1 người spam bình luận liên tục làm nghẽn hàng đợi TTS (cooldown 3.5 giây/người)

  const userKey = uniqueId || user || '';

  const now = Date.now();

  if (userKey) {

    const lastTs = commentCooldownMap.get(userKey) || 0;

    if (now - lastTs < 3500) {

      return null;

    }

    commentCooldownMap.set(userKey, now);

    if (commentCooldownMap.size > 600) {

      const oldestKey = commentCooldownMap.keys().next().value;

      commentCooldownMap.delete(oldestKey);

    }

  }

  const cleanUser = sanitizeUserName(user);

  const lower = cleanWish.toLowerCase();

  // 1. Xin xăm / Gieo quẻ

  if (

    lower.includes('xin xăm') ||

    lower.includes('xin xam') ||

    lower.includes('gieo quẻ') ||

    lower.includes('gieo que') ||

    lower.includes('rút quẻ') ||

    lower.includes('rut que') ||

    lower.includes('quẻ') ||

    lower.includes('que')

  ) {

    return Rituals.drawFortune({ user: cleanUser, uniqueId, avatar, topic: cleanWish });

  }

  // 2. Thỉnh chuông

  if (lower.includes('chuông') || lower.includes('chuong') || lower.includes('thỉnh chuông')) {

    return Rituals.ringBell({ user: cleanUser, uniqueId, avatar, count: 1, wish: cleanWish, readTts: true });

  }

  // 3. Gõ mõ

  if (lower.includes('gõ mõ') || lower.includes('go mo') || lower.includes('trống miếu')) {

    return Rituals.strikeWoodenFish({ user: cleanUser, uniqueId, avatar, count: 3 });

  }

  // 4. Thắp hương / Kính bái Quan Thánh

  if (

    lower.includes('thắp hương') ||

    lower.includes('thap huong') ||

    lower.includes('dâng hương') ||

    lower.includes('dang huong') ||

    lower.includes('bái quan') ||

    lower.includes('bai quan') ||

    lower.includes('kính quan thánh') ||

    lower.includes('kinh quan thanh') ||

    lower.includes('kính lễ quan') ||

    lower.includes('kinh le quan')

  ) {

    return Rituals.burnIncense({ user: cleanUser, uniqueId, avatar, count: 3, wish: cleanWish });

  }

  // 5. Cầu nguyện / Thả đèn hoa đăng

  if (

    lower.includes('cầu') ||

    lower.includes('cau ') ||

    lower.includes('nguyện') ||

    lower.includes('nguyen') ||

    lower.includes('quan thánh') ||

    lower.includes('quan thanh') ||

    lower.includes('bình an') ||

    lower.includes('tài lộc') ||

    lower.includes('chúc')

  ) {

    return Rituals.sendPrayer({ user: cleanUser, uniqueId, avatar, wish: cleanWish });

  }

  return Rituals.burnIncense({ user: cleanUser, uniqueId, avatar, count: 1, wish: cleanWish });

}

const giftComboTracker = new Map();

async function resolveTikTokUsername(rawInput) {

  let input = String(rawInput || '').trim();

  if (!input) {

    throw new Error('Vui lòng nhập @username hoặc link TikTok Live cần kết nối');

  }

  if (input.startsWith('http://') || input.startsWith('https://') || input.includes('tiktok.com/')) {

    const urlToFetch = input.startsWith('http') ? input : `https://${input}`;

    const directMatch = urlToFetch.match(/tiktok\.com\/@([^/?#]+)/i);

    if (directMatch && directMatch[1]) {

      return directMatch[1];

    }

    try {

      const resp = await fetch(urlToFetch, { redirect: 'follow' });

      const finalUrl = resp.url || '';

      const resolvedMatch = finalUrl.match(/tiktok\.com\/@([^/?#]+)/i);

      if (resolvedMatch && resolvedMatch[1]) {

        return resolvedMatch[1];

      }

    } catch (e) {

      console.warn('[TikTok URL Resolve Warning]', e.message);

    }

  }

  return input.replace(/^@/, '').split(/[/?#]/)[0].trim();

}

function extractUserFromEvent(data) {

  const u = data?.user || data || {};

  const uniqueId = u.uniqueId || u.displayId || data?.uniqueId || '';

  const user = u.nickname || uniqueId || data?.nickname || 'Thiện Tín';

  const avatar =

    u.profilePictureUrl ||

    u.avatarLarge?.urlList?.[0] ||

    u.avatarThumb?.urlList?.[0] ||

    u.avatarMedium?.urlList?.[0] ||

    data?.profilePictureUrl ||

    '';

  return { user, uniqueId, avatar };

}

async function connectTikTokLive(usernameOrUrl) {

  const cleanUser = await resolveTikTokUsername(usernameOrUrl);

  if (!cleanUser) {

    throw new Error('Không tìm thấy @username hợp lệ từ dữ liệu nhập vào');

  }

  if (tiktokConn) {

    try {

      await tiktokConn.disconnect();

    } catch (_) {}

    tiktokConn = null;

  }

  state.tiktok = {

    connected: false,

    connecting: true,

    username: cleanUser,

    roomId: null,

    viewerCount: 0,

    lastError: null

  };

  broadcastNotification('temple.state');

  tiktokConn = new TikTokLiveConnection(cleanUser, {

    processInitialData: true,

    fetchRoomInfoOnConnect: false,

    enableExtendedGiftInfo: false

  });

  tiktokConn.on(ControlEvent.CONNECTED, (roomState) => {

    state.tiktok.connected = true;

    state.tiktok.connecting = false;

    state.tiktok.roomId = roomState?.roomId || tiktokConn?.roomId || null;

    state.tiktok.lastError = null;

    console.log(`[TikTok Live] Đã kết nối phòng @${cleanUser} (roomId: ${state.tiktok.roomId})`);

    broadcastNotification('temple.state');

  });

  tiktokConn.on(ControlEvent.DISCONNECTED, () => {

    state.tiktok.connected = false;

    state.tiktok.connecting = false;

    console.log(`[TikTok Live] Đã ngắt kết nối @${cleanUser}`);

    broadcastNotification('temple.state');

  });

  tiktokConn.on(ControlEvent.ERROR, (err) => {

    state.tiktok.lastError = err?.message || String(err);

    console.warn('[TikTok Live Warning]', state.tiktok.lastError);

    broadcastNotification('temple.state');

  });

  tiktokConn.on(WebcastEvent.ROOM_USER, (data) => {

    const viewerCount = Number(data?.total ?? data?.viewerCount ?? 0);

    if (viewerCount > 0) {

      state.tiktok.viewerCount = viewerCount;

      broadcastNotification('temple.viewerCount', { viewerCount });

    }

  });

  tiktokConn.on(WebcastEvent.MEMBER, (data) => {

    const { user, uniqueId, avatar } = extractUserFromEvent(data);

    recordDevotee(user, uniqueId, avatar, 1, 0, 0, 'Đã vào Miếu Quan Công kính lễ Quan Thánh');

    broadcastNotification('temple.state');

  });

  tiktokConn.on(WebcastEvent.CHAT, (data) => {

    const { user, uniqueId, avatar } = extractUserFromEvent(data);

    const commentText = data?.content || data?.comment || '';

    console.log(`[TikTok Chat] ${user}: ${commentText}`);

    parseViewerComment(commentText, user, uniqueId, avatar);

  });

  tiktokConn.on(WebcastEvent.LIKE, (data) => {

    const { user, uniqueId, avatar } = extractUserFromEvent(data);

    const likeCount = Math.min(15, Math.max(1, Number(data?.count ?? data?.likeCount ?? 1)));

    Rituals.strikeWoodenFish({ user, uniqueId, avatar, count: likeCount });

  });

  const handleSocialEvent = (data) => {

    const { user, uniqueId, avatar } = extractUserFromEvent(data);

    Rituals.ringBell({

      user,

      uniqueId,

      avatar,

      count: 1,

      wish: 'Cầu cho mọi người bình an, mạnh khỏe và gặp nhiều may mắn',

      readTts: false

    });

  };

  tiktokConn.on(WebcastEvent.FOLLOW, handleSocialEvent);

  tiktokConn.on(WebcastEvent.SHARE, handleSocialEvent);

  tiktokConn.on(WebcastEvent.SOCIAL, (data) => {

    const action = String(data?.action || '');

    const disp = String(data?.common?.displayText?.displayType || data?.displayType || '').toLowerCase();

    if (action === '1' || action === '3' || disp.includes('follow') || disp.includes('share')) {

      handleSocialEvent(data);

    }

  });

  tiktokConn.on(WebcastEvent.GIFT, (data) => {

    const { user, uniqueId, avatar } = extractUserFromEvent(data);

    const giftObj = data?.gift || data?.giftDetails || {};

    const giftId = String(data?.giftId || giftObj?.id || 'rose');

    const groupId = String(data?.groupId || `\({uniqueId}\_\){giftId}`);

    const repeatCount = Math.max(1, Number(data?.repeatCount || data?.comboCount || 1));

    const prevCount = giftComboTracker.get(groupId) || 0;

    if (repeatCount <= prevCount && data?.repeatEnd) {

      giftComboTracker.delete(groupId);

      return;

    }

    const deltaCount = Math.max(1, repeatCount - prevCount);

    giftComboTracker.set(groupId, repeatCount);

    if (giftComboTracker.size > 500) {

      const firstKey = giftComboTracker.keys().next().value;

      giftComboTracker.delete(firstKey);

    }

    const diamondCount = Math.max(1, Number(giftObj?.diamondCount || data?.diamondCount || 1));

    const totalCoins = diamondCount * deltaCount;

    const rawGiftName = giftObj?.name || data?.giftName || giftObj?.describe || 'Hoa Hồng Tâm Thành';

    const displayGiftName = deltaCount > 1 ? `${deltaCount}x ${rawGiftName}` : rawGiftName;

    console.log(`[TikTok Gift] ${user} gửi \({displayGiftName} (\){totalCoins} xu)`);

    Rituals.offerGift({

      user,

      uniqueId,

      avatar,

      coins: totalCoins,

      giftName: displayGiftName,

      wish: `Thành tâm dâng ${displayGiftName} kính lễ Quan Thánh Đế Quân`

    });

  });

  try {

    const roomState = await tiktokConn.connect();

    state.tiktok.connected = true;

    state.tiktok.connecting = false;

    state.tiktok.roomId = roomState?.roomId || tiktokConn?.roomId || null;

    broadcastNotification('temple.state');

    return state.tiktok;

  } catch (err) {

    state.tiktok.connected = false;

    state.tiktok.connecting = false;

    state.tiktok.lastError = err?.message || 'Không thể kết nối phòng Live (kiểm tra tài khoản đang phát Live chưa)';

    broadcastNotification('temple.state');

    throw new Error(state.tiktok.lastError);

  }

}

function disconnectTikTokLive() {

  if (tiktokConn) {

    try {

      tiktokConn.disconnect();

    } catch (_) {}

    tiktokConn = null;

  }

  state.tiktok.connected = false;

  state.tiktok.connecting = false;

  state.tiktok.viewerCount = 0;

  broadcastNotification('temple.state');

  return state.tiktok;

}

// ============================================================================

// 6. AUTO-SIMULATION ENGINE (CHẾ ĐỘ TỰ ĐỘNG GIẢ LẬP ĐÔNG NGƯỜI XEM)

// ============================================================================

let autoSimTimer = null;
let simSequence = 0;
let simNameCursor = 0;

const SIM_SURNAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Mai', 'Trịnh', 'Lâm'];
const SIM_MIDDLE_NAMES = ['Minh', 'Thanh', 'Gia', 'Quốc', 'Bảo', 'Anh', 'Đức', 'Khánh', 'Hải', 'Thiên', 'Nhật', 'Thành', 'Kim', 'Tuệ', 'Hoài', 'Phúc'];
const SIM_GIVEN_NAMES = ['An', 'Bình', 'Châu', 'Duy', 'Giang', 'Hà', 'Hưng', 'Khang', 'Lan', 'Long', 'Nam', 'Ngọc', 'Phát', 'Quân', 'Sơn', 'Thảo', 'Thịnh', 'Trang', 'Tú', 'Vy'];
const SIM_WISHES = [
  'Kính nguyện giao thương thuận lợi, đối tác đồng lòng, hợp đồng hanh thông',
  'Kính nguyện cửa hàng đông khách, khách mua vui vẻ, người bán giữ trọn chữ tín',
  'Kính nguyện dòng tiền ổn định, công nợ thuận hòa, việc làm ăn bền vững',
  'Kính nguyện chọn đúng cộng sự, cùng nhau phát triển lâu dài và chính trực',
  'Kính nguyện khai trương hồng phát, hàng hóa lưu thông, khách hàng tin tưởng',
  'Kính nguyện gia đạo bình an, sức khỏe vẹn toàn, kinh doanh thuận buồm xuôi gió',
  'Kính nguyện sáng suốt khi quyết định, giữ nghĩa tín trong mọi cuộc giao thương',
  'Kính nguyện tài lộc hanh thông, nhân viên đồng lòng, công việc phát triển'
];

// Xáo trước toàn bộ tổ hợp tên: tên mỗi lượt là ngẫu nhiên nhưng không lặp lại.
const SIM_NAME_POOL = [];
for (const surname of SIM_SURNAMES) {
  for (const middle of SIM_MIDDLE_NAMES) {
    for (const given of SIM_GIVEN_NAMES) SIM_NAME_POOL.push(`${surname} ${middle} ${given}`);
  }
}
for (let i = SIM_NAME_POOL.length - 1; i > 0; i -= 1) {
  const j = Math.floor(Math.random() * (i + 1));
  [SIM_NAME_POOL[i], SIM_NAME_POOL[j]] = [SIM_NAME_POOL[j], SIM_NAME_POOL[i]];
}

function nextSimDevotee() {
  const cycle = Math.floor(simNameCursor / SIM_NAME_POOL.length);
  const baseName = SIM_NAME_POOL[simNameCursor % SIM_NAME_POOL.length];
  simNameCursor += 1;
  simSequence += 1;
  const user = cycle === 0 ? baseName : `${baseName} ${cycle + 1}`;
  const uniqueId = `sim_${String(simSequence).padStart(5, '0')}_${user.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')}`;
  return {
    user,
    uniqueId,
    wish: SIM_WISHES[Math.floor(Math.random() * SIM_WISHES.length)]
  };
}

function runSingleSimulationStep() {

  const pick = nextSimDevotee();
  // Chỉ đọc một trong bốn lượt để không làm nghẽn hàng đợi ZeroTTS.
  const readTts = simSequence % 4 === 1;
  const roll = Math.random();

  if (roll < 0.52) {

    Rituals.burnIncense({ user: pick.user, uniqueId: pick.uniqueId, count: Math.random() < 0.25 ? 5 : 3, wish: pick.wish, readTts });

  } else if (roll < 0.78) {

    Rituals.sendPrayer({ user: pick.user, uniqueId: pick.uniqueId, wish: pick.wish, readTts });

  } else {

    const offering = Math.random() < 0.55
      ? { giftType: 'lotus', coins: 15, giftName: 'Đài Hoa Sen Vàng' }
      : { giftType: 'fruit', coins: 30, giftName: 'Mâm Ngũ Quả Cát Tường' };
    Rituals.offerGift({ user: pick.user, uniqueId: pick.uniqueId, wish: pick.wish, readTts, ...offering });

  }

}

function configureAutoSim(enabled) {

  state.settings.autoSim = Boolean(enabled);

  if (autoSimTimer) {

    clearTimeout(autoSimTimer);

    autoSimTimer = null;

  }

  if (state.settings.autoSim) {

    runSingleSimulationStep();

    const baseInterval = Math.max(6800, Math.min(7600, Number(state.settings.autoSimIntervalMs) || 7200));
    const scheduleNext = () => {
      const jitter = Math.floor(Math.random() * 801) - 400;
      autoSimTimer = setTimeout(() => {
        if (!state.settings.autoSim) return;
        runSingleSimulationStep();
        scheduleNext();
      }, baseInterval + jitter);
    };
    scheduleNext();

  }

}

// ============================================================================

// 7. JSON-RPC 2.0 DISPATCHER

// ============================================================================

async function handleRpcCall(method, params = {}) {

  switch (method) {

    case 'temple.getState':

      return getPublicState();

    case 'temple.burnIncense':

      return Rituals.burnIncense(params);

    case 'temple.strikeWoodenFish':

      return Rituals.strikeWoodenFish(params);

    case 'temple.ringBell':

      return Rituals.ringBell(params);

    case 'temple.sendPrayer':

      return Rituals.sendPrayer(params);

    case 'temple.offerGift':

      return Rituals.offerGift(params);

    case 'temple.drawFortune':

      return Rituals.drawFortune(params);

    case 'temple.grandCeremony':

      return Rituals.grandCeremony(params);

    case 'temple.updateSettings':

      return Rituals.updateSettings(params);

    case 'temple.resetMerit':

      return Rituals.resetMerit();

    case 'temple.comment':

      return parseViewerComment(params.comment, params.user, params.uniqueId, params.avatar);

    case 'temple.speak': {

      const text = normalizeQuanCongInvocation(params.text);

      const res = await zeroTts.synthesize(text, params.voice || 'maichi');

      if (res.ok && params.broadcast !== false) {

        broadcastNotification('tts.play', {

          text,

          voice: res.voice,

          url: res.url

        });

      }

      return res;

    }

    case 'temple.ttsStatus':

      return zeroTts.getStatus();

    case 'live.connect':

      return await connectTikTokLive(params.username);

    case 'live.disconnect':

      return disconnectTikTokLive();

    case 'live.setAutoSim':

      configureAutoSim(Boolean(params.enabled));

      saveState();

      broadcastNotification('temple.state');

      return getPublicState();

    default:

      throw new Error(`Không tìm thấy phương thức JSON-RPC: ${method}`);

  }

}

// ============================================================================

// 8. EXPRESS + WEBSOCKET SERVER

// ============================================================================

const app = express();

app.use(cors());

app.use(express.json({ limit: '2mb' }));

app.use('/tts-cache', express.static(TTS_CACHE_DIR, { maxAge: '7d' }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', (_req, res) => {

  res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');

  res.sendFile(path.join(__dirname, 'public', 'admin.html'));

});

// HTTP JSON-RPC 2.0 Endpoint

app.post('/rpc', async (req, res) => {

  const { jsonrpc, id, method, params } = req.body || {};

  if (!method) {

    return res.status(400).json({

      jsonrpc: '2.0',

      id: id ?? null,

      error: { code: -32600, message: 'Invalid JSON-RPC Request: thiếu method' }

    });

  }

  try {

    const result = await handleRpcCall(method, params || {});

    res.json({

      jsonrpc: jsonrpc || '2.0',

      id: id ?? null,

      result

    });

  } catch (err) {

    res.status(200).json({

      jsonrpc: jsonrpc || '2.0',

      id: id ?? null,

      error: { code: -32000, message: err.message || 'Server error' }

    });

  }

});

// ZeroTTS HTTP Endpoint (Mai Chi default)

app.all('/api/tts', async (req, res) => {

  const text = normalizeQuanCongInvocation(req.body?.text || req.query?.text || '').trim();

  const voice = (req.body?.voice || req.query?.voice || state.settings.ttsVoice || 'maichi').trim();

  if (!text) {

    return res.status(400).json({ ok: false, error: 'Thiếu nội dung text cần đọc' });

  }

  const result = await zeroTts.synthesize(text, voice);

  res.json(result);

});

app.get('/api/state', (_req, res) => {

  res.json(getPublicState());

});

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });

const STATE_BROADCAST_INTERVAL_MS = 300;
let stateBroadcastTimer = null;

function broadcastNotificationNow(method, params) {

  const payload = JSON.stringify({

    jsonrpc: '2.0',

    method,

    params

  });

  for (const client of wss.clients) {

    if (client.readyState === 1) {

      client.send(payload);

    }

  }

}

function scheduleStateBroadcast() {

  if (stateBroadcastTimer) return;

  stateBroadcastTimer = setTimeout(() => {

    stateBroadcastTimer = null;

    broadcastNotificationNow('temple.state', getPublicState());

  }, STATE_BROADCAST_INTERVAL_MS);

}

function broadcastTempleEvent(event) {

  broadcastNotificationNow('temple.event', { event });

  scheduleStateBroadcast();

}

function broadcastNotification(method, params) {

  if (method === 'temple.state') {

    scheduleStateBroadcast();

    return;

  }

  broadcastNotificationNow(method, params);

}

wss.on('connection', (ws) => {

  ws.send(

    JSON.stringify({

      jsonrpc: '2.0',

      method: 'temple.state',

      params: getPublicState()

    })

  );

  ws.on('message', async (raw) => {

    let msg;

    try {

      msg = JSON.parse(raw.toString('utf8'));

    } catch (_) {

      return;

    }

    if (!msg || !msg.method) return;

    try {

      const result = await handleRpcCall(msg.method, msg.params || {});

      if (msg.id !== undefined) {

        ws.send(

          JSON.stringify({

            jsonrpc: '2.0',

            id: msg.id,

            result

          })

        );

      }

    } catch (err) {

      if (msg.id !== undefined) {

        ws.send(

          JSON.stringify({

            jsonrpc: '2.0',

            id: msg.id,

            error: { code: -32000, message: err.message || 'RPC Error' }

          })

        );

      }

    }

  });

});

const zeroTts = new ZeroTTSManager();

server.listen(PORT, () => {

  console.log(`============================================================`);

  console.log(`⚔️ MIẾU QUAN CÔNG TIKTOK LIVE RPC ĐÃ KHỞI ĐỘNG`);

  console.log(`📺 Màn hình Live (9:16 OBS): http://localhost:${PORT}`);

  console.log(`🎛️ Bảng điều khiển RPC Admin: http://localhost:${PORT}/admin`);

  console.log(`🔌 JSON-RPC 2.0 Endpoint   : http://localhost:\({PORT}/rpc (ws\://localhost:\){PORT}/ws)`);

  console.log(`============================================================`);

  // Tiếp tục giả lập sau khi khởi động lại nếu người quản trị đã bật chế độ này.
  if (state.settings.autoSim) configureAutoSim(true);

  // Tự động kết nối tới @zenfacts_vn ngay khi khởi động server

  const defaultChannel = process.env.TIKTOK_USER || state.tiktok?.username || 'zenfacts_vn';

  if (defaultChannel) {

    connectTikTokLive(defaultChannel).catch((err) => {

      console.warn(`[Auto-Connect @${defaultChannel}] Chưa kết nối được ngay:`, err.message);

    });

  }

});
