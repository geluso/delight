var WIDTH = 100;
var HEIGHT = 2400;
var AMP = 70;

this.Waveform = function(_arg) {
  var canvas, file, loadBuffer, onReady, onStatus, req, sections, self, status;
  file = _arg.file, canvas = _arg.canvas, onStatus = _arg.onStatus, onReady = _arg.onReady;
  if (_arg.width) {
    WIDTH = _arg.width;
  }
  if (_arg.height) {
    console.log(WIDTH, _arg.height);
    HEIGHT = _arg.height;
    console.log(WIDTH, _arg.height);
  }
  canvas = $(canvas);

  canvas[0].width = WIDTH;
  canvas[0].height = HEIGHT;

  status = $(status);

  // number of sections to sample
  sections = canvas.attr('height');

  self = {
    view: WaveformView(canvas)
  };
  req = new XMLHttpRequest();
  req.open('GET', file, true);
  req.responseType = 'arraybuffer';
  req.onprogress = function(e) {
    return typeof onStatus === "function" ? onStatus(e.loaded / e.total) : void 0;
  };
  req.onload = function() {
    return loadBuffer(req.response);
  };
  req.send();
  loadBuffer = function(arr) {
    var audio, buf;
    audio = new webkitAudioContext();
    audio.decodeAudioData(arr, function(buf) {
      ProcessAudio.extract(buf.getChannelData(0), sections, self.view.drawBar);
      self.playback = PlayBuffer(audio, buf);

      self.view.onCursor = self.playback.playAt;
      setInterval(function() {
        return self.view.moveCursor(self.playback.getTime() / buf.duration);
      }, 100);
      return typeof onReady === "function" ? onReady() : void 0;
    });
  };
  return self;
};

this.WaveformView = function(canvas) {
  var ctx, cursor, height, overlay, self, width, _ref;
    _ref = canvas[0],
    width = _ref.width,
    height = _ref.height;
    ctx = canvas[0].getContext('2d');
  ctx.fillStyle = 'black';
  cursor = $("<div style=\"\n  position: relative;\n  width: " + (width + 10) + "px;\n  height: 2px;\n  background-color: red;\">");
  overlay = $("<div style=\"\n  position: relative;\n  top: -" + height + "px;\n  height: 0px;\">");
  overlay.append(cursor);
  canvas.after(overlay);
  canvas.click(function(e) {
    var my;
    my = e.pageY - this.offsetTop;
    cursor.css('top', my);
    return typeof self.onCursor === "function" ? self.onCursor(my / height) : void 0;
  });
  return self = {
    drawBar: function(i, val) {
      var vol = val * AMP * width,
          y = i,
          x = width / 2 - vol / 2,
          h = 1,
          w = vol;
      return ctx.fillRect(x, y, w, h);
    },
    moveCursor: function(pos) {
      //ctx.fillRect(0, pos * height, WIDTH, 5);
      return cursor.css('top', pos * height);
    }
  };
};

this.PlayBuffer = function(audio, buffer) {
  var node, paused, self, start, timeBasis, timeStart;
  node = null;
  timeStart = null;
  timeBasis = null;
  paused = null;
  start = function(t) {
    timeStart = Date.now();
    timeBasis = t;
    node = audio.createBufferSource();
    node.buffer = buffer;
    node.connect(audio.destination);
    if (t === 0) {
      return node.start(0);
    } else {
      return node.start(0, t);
    }
  };
  start(0);
  return self = {
    play: function() {
      start(paused || 0);
      return paused = null;
    },
    playAt: function(t) {
      node.stop(0);
      start(t * buffer.duration);
      return paused = null;
    },
    getTime: function() {
      return paused || Math.min((Date.now() - timeStart) / 1000 + timeBasis, buffer.duration);
    },
    pause: function() {
      node.stop(0);
      return paused = self.getTime();
    },
    isPaused: function() {
      return paused !== null;
    }
  };
};

this.ProcessAudio = {
  extract: function(buffer, sections, out, done) {
    var f, i, int, len;
    len = Math.floor(buffer.length / sections);
    i = 0;
    f = function() {
      var end, pos, _results;
      end = i + 10;
      _results = [];
      while (i < end) {
        pos = i * len;
        out(i, ProcessAudio.measure(pos, pos + len, buffer));
        i++;
        if (i >= sections) {
          clearInterval(int);
          if (typeof done === "function") done();
          break;
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    return int = setInterval(f, 1);
  },
  measure: function(a, b, data) {
    var i, s, sum, _ref;
    sum = 0.0;
    for (i = a, _ref = b - 1; a <= _ref ? i <= _ref : i >= _ref; a <= _ref ? i++ : i--) {
      s = data[i];
      sum += s * s;
    }
    return Math.sqrt(sum / data.length);
  }
};
