/*
Copyright 2022 bluu and fluffyball9 GNU GPL v3

When reproducing this file, always include this text in the file.
*/

/*
Copyright (c) 2013 dissimulate at codepen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT evNOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/* Clarity engine */

document.body.innerHTML +=
  '<a href="' +
  (typeof credirect !== "undefined" ? credirect : "/bonus/") +
  '" class="back"><div class="arrow"></div></a>';
  
  var st = window.localStorage;
  window.storage = undefined;
  Object.defineProperty(window, "localStorage", {get:()=>undefined});

window.Clarity = function() {
  this.alert_errors = false;
  this.log_info = true;
  this.tile_size = 16;
  this.limit_viewport = false;
  this.jump_switch = 0;

  this.viewport = {
    x: 200,
    y: 200
  };

  this.camera = {
    x: 0,
    y: 0
  };

  this.key = {
    left: false,
    right: false,
    up: false
  };

  this.player = {
    loc: {
      x: 0,
      y: 0
    },

    vel: {
      x: 0,
      y: 0
    },

    can_jump: true
  };

  window.onkeydown = this.keydown.bind(this);
  window.onkeyup = this.keyup.bind(this);
};

Clarity.prototype.error = function(message) {
  if (this.alert_errors) alert(message);
  if (this.log_info) console.log(message);
};

Clarity.prototype.log = function(message) {
  if (this.log_info) console.log(message);
};

Clarity.prototype.set_viewport = function(x, y) {
  this.viewport.x = x;
  this.viewport.y = y;
};

Clarity.prototype.keydown = function(e) {
  var _this = this;

  switch (e.keyCode) {
    case 37:
      _this.key.left = true;
      break;
    case 38:
      _this.key.up = true;
      break;
    case 39:
      _this.key.right = true;
      break;
    case 65:
      _this.key.left = true;
      break;
    case 87:
      _this.key.up = true;
      break;
    case 68:
      _this.key.right = true;
      break;
  }
};

Clarity.prototype.keyup = function(e) {
  var _this = this;

  switch (e.keyCode) {
    case 37:
      _this.key.left = false;
      break;
    case 38:
      _this.key.up = false;
      break;
    case 39:
      _this.key.right = false;
      break;
    case 65:
      _this.key.left = false;
      break;
    case 87:
      _this.key.up = false;
      break;
    case 68:
      _this.key.right = false;
      break;
  }
};

Clarity.prototype.load_map = function(map) {
  if (
    typeof map === "undefined" ||
    typeof map.data === "undefined" ||
    typeof map.keys === "undefined"
  ) {
    this.error("Error: Invalid map data!");

    return false;
  }

  if (typeof load === "function") {
    load();
  }

  this.current_map = map;

  if (typeof sprites !== "undefined") {
    for (var i in sprites) {
      map.keys[i].sprite = sprites[i];
    }
  }

  this.current_map.background = map.background || "#333";
  this.current_map.gravity = map.gravity || { x: 0, y: 0.3 };
  this.tile_size = map.tile_size || 16;
  this.player.can_jump = true;

  var _this = this;

  this.current_map.width = 0;
  this.current_map.height = 0;

  map.keys.forEach(function(key) {
    map.data.forEach(function(row, y) {
      _this.current_map.height = Math.max(_this.current_map.height, y);

      row.forEach(function(tile, x) {
        _this.current_map.width = Math.max(_this.current_map.width, x);
        if (tile == key.id) _this.current_map.data[y][x] = key;
      });
    });
  });

  this.current_map.width_p = this.current_map.width * this.tile_size;
  this.current_map.height_p = this.current_map.height * this.tile_size;

  this.player.loc.x = map.player.x * this.tile_size || 0;
  this.player.loc.y = map.player.y * this.tile_size || 0;
  this.player.color = map.player.color || "#000";

  this.key.left = false;
  this.key.up = false;
  this.key.right = false;

  this.camera = {
    x: 0,
    y: 0
  };

  this.player.vel = {
    x: 0,
    y: 0
  };

  if (
    _this.current_map.data[map.player.y][map.player.x] &&
    _this.current_map.data[map.player.y][map.player.x].script == "death"
  )
    this.last_tile = _this.current_map.data[map.player.y][map.player.x].id;

  this.log("Successfully loaded map data.");

  return true;
};

Clarity.prototype.get_tile = function(x, y) {
  return this.current_map.data[y] && this.current_map.data[y][x]
    ? this.current_map.data[y][x]
    : 0;
};

Clarity.prototype.draw_tile = function(x, y, tile, context) {
  if (!tile || !tile.color) return;

  context.fillStyle = tile.color;
  context.fillRect(
    Math.floor(x),
    Math.floor(y),
    this.tile_size + 1,
    this.tile_size + 1
  );
  if (!tile || !tile.sprite) return;
  ctx.drawImage(tile.sprite, x, y, this.tile_size, this.tile_size);
};

Clarity.prototype.draw_map = function(context, fore) {
  for (
    var y = Math.max(0, Math.floor(this.camera.y / this.tile_size) - 4);
    y <
    Math.min(
      this.current_map.data.length,
      Math.floor((this.camera.y + this.viewport.y) / this.tile_size) + 4
    );
    y++
  ) {
    for (
      var x = Math.max(0, Math.floor(this.camera.x / this.tile_size) - 4);
      x <
      Math.min(
        this.current_map.data[y].length,
        Math.floor((this.camera.x + this.viewport.x) / this.tile_size) + 4
      );
      x++
    ) {
      var t_x = x * this.tile_size - this.camera.x;
      var t_y = y * this.tile_size - this.camera.y;
      if (!fore && this.current_map.data[y][x].bg) {
        /*if (
          t_x < -this.tile_size * (typeof crotation !== "undefined" ? 4 : 1) ||
          t_y < -this.tile_size * (typeof crotation !== "undefined" ? 4 : 1) ||
          t_x >
            this.viewport.x +
              (typeof crotation !== "undefined" ? this.tile_size*3 : 0) ||
          t_y >
            this.viewport.y +
              (typeof crotation !== "undefined" ? this.tile_size*3 : 0)
        ) {
        } else {*/
        var temp = JSON.parse(JSON.stringify(this.current_map.data[y][x]));
        temp.color = temp.bg;
        this.draw_tile(t_x, t_y, temp, context);
        //}
      }
      if (
        (!fore && !this.current_map.data[y][x].fore) ||
        (fore && this.current_map.data[y][x].fore)
      ) {
        /*if (
          t_x < -this.tile_size * (typeof crotation !== "undefined" ? 4 : 1) ||
          t_y < -this.tile_size * (typeof crotation !== "undefined" ? 4 : 1) ||
          t_x >
            this.viewport.x +
              (typeof crotation !== "undefined" ? this.tile_size * 3 : 0) ||
          t_y >
            this.viewport.y +
              (typeof crotation !== "undefined" ? this.tile_size * 3 : 0)
        )
          continue;*/

        this.draw_tile(t_x, t_y, this.current_map.data[y][x], context);
      }
    }
  }
};

Clarity.prototype.move_player = function() {
  var tile = this.get_tile(
    Math.round(this.player.loc.x / this.tile_size),
    Math.round(this.player.loc.y / this.tile_size)
  );
  var otile = {};
  if(factor<1) {
    if(tile.gravity) {
      otile.gx = tile.gravity.x;
      otile.gy = tile.gravity.y;
      tile.gravity.x *= factor * factor;
      tile.gravity.y *= factor * factor;
    }
    else {
      this.current_map.gravity.ox = this.current_map.gravity.x;
      this.current_map.gravity.oy = this.current_map.gravity.y;
      this.current_map.gravity.x  *= factor * factor;
      this.current_map.gravity.y  *= factor * factor;
    }
    if(tile.friction) {
      otile.fx = tile.friction.x;
      otile.fy = tile.friction.y;
      tile.friction.x = Math.pow(tile.friction.x, factor);
      tile.friction.y = Math.pow(tile.friction.y, factor);
    }
  }
  var tX = this.player.loc.x + this.player.vel.x;
  var tY = this.player.loc.y + this.player.vel.y;

  var offset = Math.round(this.tile_size / 2 - 1);

  if (tile.gravity) {
    this.player.vel.x += tile.gravity.x;
    this.player.vel.y += tile.gravity.y;
  } else {
    this.player.vel.x += this.current_map.gravity.x;
    this.player.vel.y += this.current_map.gravity.y;
  }

  if (tile.friction) {
    this.player.vel.x *= tile.friction.x;
    this.player.vel.y *= tile.friction.y;
  }

  var t_y_up = Math.floor(tY / this.tile_size);
  var t_y_down = Math.ceil(tY / this.tile_size);
  var y_near1 = Math.round((this.player.loc.y - offset) / this.tile_size);
  var y_near2 = Math.round((this.player.loc.y + offset) / this.tile_size);

  var t_x_left = Math.floor(tX / this.tile_size);
  var t_x_right = Math.ceil(tX / this.tile_size);
  var x_near1 = Math.round((this.player.loc.x - offset) / this.tile_size);
  var x_near2 = Math.round((this.player.loc.x + offset) / this.tile_size);

  var top1 = this.get_tile(x_near1, t_y_up);
  var top2 = this.get_tile(x_near2, t_y_up);
  var bottom1 = this.get_tile(x_near1, t_y_down);
  var bottom2 = this.get_tile(x_near2, t_y_down);
  var left1 = this.get_tile(t_x_left, y_near1);
  var left2 = this.get_tile(t_x_left, y_near2);
  var right1 = this.get_tile(t_x_right, y_near1);
  var right2 = this.get_tile(t_x_right, y_near2);

  if ((tile.jump && this.jump_switch > 15) || this.current_map.fly) {
    this.player.can_jump = true;

    this.jump_switch = 0;
  } else this.jump_switch+=factor;

  this.player.vel.x = Math.min(
    Math.max(this.player.vel.x, -this.current_map.vel_limit.x),
    this.current_map.vel_limit.x
  );
  this.player.vel.y = Math.min(
    Math.max(this.player.vel.y, -this.current_map.vel_limit.y),
    this.current_map.vel_limit.y
  );

  this.player.loc.x += this.player.vel.x;
  this.player.loc.y += this.player.vel.y;

  this.player.vel.x *= factor<1?Math.pow(0.9, factor):0.9;

  if (left1.solid || left2.solid || right1.solid || right2.solid) {
    /* fix overlap */

    while (
      this.get_tile(Math.floor(this.player.loc.x / this.tile_size), y_near1)
        .solid ||
      this.get_tile(Math.floor(this.player.loc.x / this.tile_size), y_near2)
        .solid
    )
      this.player.loc.x += 0.1;

    while (
      this.get_tile(Math.ceil(this.player.loc.x / this.tile_size), y_near1)
        .solid ||
      this.get_tile(Math.ceil(this.player.loc.x / this.tile_size), y_near2)
        .solid
    )
      this.player.loc.x -= 0.1;

    /* tile bounce */

    var bounce = 0;

    if (left1.solid && left1.bounce > bounce) bounce = left1.bounce;
    if (left2.solid && left2.bounce > bounce) bounce = left2.bounce;
    if (right1.solid && right1.bounce > bounce) bounce = right1.bounce;
    if (right2.solid && right2.bounce > bounce) bounce = right2.bounce;

    this.player.vel.x *= -bounce || 0;
  }

  if (top1.solid || top2.solid || bottom1.solid || bottom2.solid) {
    /* fix overlap */

    while (
      this.get_tile(x_near1, Math.floor(this.player.loc.y / this.tile_size))
        .solid ||
      this.get_tile(x_near2, Math.floor(this.player.loc.y / this.tile_size))
        .solid
    )
      this.player.loc.y += 0.1;

    while (
      this.get_tile(x_near1, Math.ceil(this.player.loc.y / this.tile_size))
        .solid ||
      this.get_tile(x_near2, Math.ceil(this.player.loc.y / this.tile_size))
        .solid
    )
      this.player.loc.y -= 0.1;

    /* tile bounce */

    var bounce = 0;

    if (top1.solid && top1.bounce > bounce) bounce = top1.bounce;
    if (top2.solid && top2.bounce > bounce) bounce = top2.bounce;
    if (bottom1.solid && bottom1.bounce > bounce) bounce = bottom1.bounce;
    if (bottom2.solid && bottom2.bounce > bounce) bounce = bottom2.bounce;

    this.player.vel.y *= -bounce || 0;
    typeof onbounce === "function" ? onbounce() : 0;
    if ((bottom1.solid || bottom2.solid) && !tile.jump) {
      this.player.on_floor = true;
      this.player.can_jump = true;
    }
  }

  // adjust camera

  if (typeof cnofollow === "undefined") {
    var c_x = Math.round(this.player.loc.x - this.viewport.x / 2);
    var c_y = Math.round(this.player.loc.y - this.viewport.y / 2);
    var x_dif = Math.abs(c_x - this.camera.x);
    var y_dif = Math.abs(c_y - this.camera.y);

    if (x_dif > 5) {
      var mag = Math.round(Math.max(1, x_dif * 0.1));

      if (c_x != this.camera.x) {
        this.camera.x +=
          (typeof shiverx !== "undefined" ? shiverx : 0) + c_x > this.camera.x
            ? mag
            : -mag;

        if (this.limit_viewport) {
          this.camera.x = Math.min(
            this.current_map.width_p - this.viewport.x + this.tile_size,
            this.camera.x
          );

          this.camera.x = Math.max(0, this.camera.x);
        }
      }
    }

    if (y_dif > 5) {
      var mag = Math.round(Math.max(1, y_dif * 0.1));

      if (c_y != this.camera.y) {
        this.camera.y +=
          (typeof shivery !== "undefined" ? shivery : 0) + c_y > this.camera.y
            ? mag
            : -mag;

        if (this.limit_viewport) {
          this.camera.y = Math.min(
            this.current_map.height_p - this.viewport.y + this.tile_size,
            this.camera.y
          );

          this.camera.y = Math.max(0, this.camera.y);
        }
      }
    }
  }
  
  if(factor<1) {
    /*if(tile.gravity) {
      tile.gravity.x /= factor * factor;
      tile.gravity.y /= factor * factor;
    }
    else {
      this.current_map.gravity.x  /= factor * factor;
      this.current_map.gravity.y  /= factor * factor;
    }
    if(tile.friction) {
      tile.friction.x /= factor;
      tile.friction.y /= factor;
    }*/
    this.player.vel.x /= factor;
    this.player.vel.y /= factor;
    this.current_map.vel_limit.x = this.current_map.vel_limit.ox;
    this.current_map.vel_limit.y = this.current_map.vel_limit.oy;
    this.current_map.movement_speed.left = this.current_map.movement_speed.oleft;
    this.current_map.movement_speed.right = this.current_map.movement_speed.oright;
    this.current_map.movement_speed.jump = this.current_map.movement_speed.ojump;
    if(tile.gravity) {
      tile.gravity.x = otile.gx;
      tile.gravity.y = otile.gy;
    } else {
      this.current_map.gravity.x = this.current_map.gravity.ox;
      this.current_map.gravity.y = this.current_map.gravity.oy;
      
    }
    if(tile.friction) {
      tile.friction.x = otile.fx;
      tile.friction.y = otile.fy;
    }
  }

  if (
    this.player.loc.y > this.current_map.height_p &&
    typeof fallOutMap !== "undefined"
  ) {
    Function("storage","game",this.current_map.scripts[fallOutMap]).bind(this)(st,game);
  }
  var lastLastTile = this.last_tile;
  this.last_tile = tile.id;

  if (lastLastTile != tile.id && tile.script) {
    var scripts = tile.script.split(",");
    for (var i = 0; i < scripts.length; i++)
      Function("storage","game",this.current_map.scripts[scripts[i]]).bind(this)(st,game);
  }
};

Clarity.prototype.update_player = function() {
  if(factor<1) {
    this.current_map.vel_limit.ox = this.current_map.vel_limit.x;
    this.current_map.vel_limit.oy = this.current_map.vel_limit.y;
    this.current_map.movement_speed.oleft = this.current_map.movement_speed.left;
    this.current_map.movement_speed.oright = this.current_map.movement_speed.right;
    this.current_map.movement_speed.ojump = this.current_map.movement_speed.jump;
    this.player.vel.x *= factor;
    this.player.vel.y *= factor;
    this.current_map.vel_limit.x *= factor;
    this.current_map.vel_limit.y *= factor;
    this.current_map.movement_speed.left *= factor * factor;
    this.current_map.movement_speed.right *= factor * factor;
    this.current_map.movement_speed.jump *= factor;
  }
  if (this.key.left) {
    if (this.player.vel.x > -this.current_map.vel_limit.x)
      this.player.vel.x -= this.current_map.movement_speed.left;
  }

  if (this.key.up) {
    if (
      this.player.can_jump &&
      this.player.vel.y > -this.current_map.vel_limit.y
    ) {
      this.player.vel.y -= this.current_map.movement_speed.jump;
      this.player.can_jump = false;
    }
  }

  if (this.key.right) {
    if (this.player.vel.x < this.current_map.vel_limit.x)
      this.player.vel.x += this.current_map.movement_speed.right;
  }

  this.move_player();
};

Clarity.prototype.draw_player = function(context) {
  if (typeof playersprite !== "undefined") {
    context.drawImage(
      playersprite,
      this.player.loc.x - this.camera.x,
      this.player.loc.y - this.camera.y,
      this.tile_size,
      this.tile_size
    );
    return;
  }
  context.fillStyle = this.player.color;
  context.beginPath();

  context.arc(
    this.player.loc.x + this.tile_size / 2 - this.camera.x,
    this.player.loc.y + this.tile_size / 2 - this.camera.y,
    this.tile_size / 2 - 1,
    0,
    Math.PI * 2
  );

  context.fill();
};

Clarity.prototype.update = function() {
  this.update_player();
};

Clarity.prototype.draw = function(context) {
  if (typeof crotation !== "undefined") {
    context.translate(this.viewport.x / 2, this.viewport.y / 2);
    context.rotate(crotation);
    context.translate(-this.viewport.x / 2, -this.viewport.y / 2);
  }
  this.draw_map(context, false);
  this.draw_player(context);
  this.draw_map(context, true);
  if (typeof crotation !== "undefined") {
    context.translate(this.viewport.x / 2, this.viewport.y / 2);
    context.rotate(-crotation);
    context.translate(-this.viewport.x / 2, -this.viewport.y / 2);
  }
};

/* Setup of the engine */

window.requestAnimFrame =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function(callback) {
    return window.setTimeout(callback, 1000 / 60);
  };

var canvas = document.getElementById("canvas"),
  ctx = canvas.getContext("2d");

canvas.width = typeof width !== "undefined" ? width : 700;
canvas.height = 700;

var frameCount = 0;
var factor = 0;
var dead = false;
var game = new Clarity();
game.set_viewport(canvas.width, canvas.height);
canvas.setAttribute("class", "");
if (typeof mapname !== "undefined") {
  window[mapname].scripts["next_level"] += ";alert('Your time was: ' + Math.round(frameCount*fpsInterval/10)/100)";
  window[mapname].scripts["death"] += ";then=performance.now();frameCount=0";
  game.load_map(JSON.parse(JSON.stringify(window[mapname])));
} else if (typeof map === "undefined") {
  fly.scripts["next_level"] += ";alert('Your time was: ' + Math.round(frameCount*fpsInterval/10)/100)";
  fly.scripts["death"] += ";then=performance.now();frameCount=0";
  game.load_map(JSON.parse(JSON.stringify(fly)));
} else {
  map.scripts["next_level"] += ";alert('Your time was: ' + Math.round(frameCount*fpsInterval/10)/100)"
  map.scripts["death"] += ";then=performance.now();frameCount=0";
  game.load_map(JSON.parse(JSON.stringify(map)));
}
var sd = 990040;
var interval = 10;
var sec = 0;
var expected = Date.now() + interval;
typeof stopwatch !== "undefined" && setTimeout(step, interval);
function step() {
  var dt = Date.now() - expected; // the drift (positive for overshooting)
  if (dt > interval) {
    // something really bad happened. Maybe the browser (tab) was inactive?
    // possibly special handling to avoid futile "catch up" run
  }
  sec += 10;
  expected += interval;
  setTimeout(step, Math.max(0, interval - dt)); // take into account drift
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* Limit the viewport to the confines of the map */
game.limit_viewport =
  typeof nolimitviewport !== "undefined" ? !nolimitviewport : true;


var now,
  elapsed,
  then,
  fpsInterval = 1000 / 60;

var fquery = window.location.href.split('?fps=')
if(fquery[1] != null){
  fquery = parseFloat(fquery[1]);
  fpsInterval = 1000 / fquery
}

var Loop = async function() {
  window.requestAnimFrame(Loop);

  now = performance.now();
  elapsed = now - then;
  //if (elapsed >= fpsInterval) {
    factor=elapsed/fpsInterval;
    then = now// - (elapsed % fpsInterval);
    if (typeof nofill === "undefined" || !nofill) {
      ctx.fillStyle = typeof fillcolor !== "undefined" ? fillcolor : "#333";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (typeof bg !== "undefined") {
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    }
    frameCount+=factor;
    do {
      dead || game.update();
      elapsed -= fpsInterval;
      factor--;
    } while(elapsed>fpsInterval);
    game.draw(ctx);
  //}
  typeof frame === "function" ? frame() : null;
};

/*eval(
  (function(p, a, c, k, e, d) {
    console.log("Please close the console to access this webpage.");
    e = function(c) {
      return c.toString(36);
    };
    if (!"".replace(/^/, String)) {
      while (c--) {
        d[c.toString(a)] = k[c] || c.toString(a);
      }
      k = [
        function(e) {
          return d[e];
        }
      ];
      e = function() {
        return "\\w+";
      };
      c = 1;
    }
    while (c--) {
      if (k[c]) {
        p = p.replace(new RegExp("\\b" + e(c) + "\\b", "g"), k[c]);
      }
    }
    return p;
  })(
    "(3(){(3 a(){8{(3 b(2){7((''+(2/2)).6!==1||2%5===0){(3(){}).9('4')()}c{4}b(++2)})(0)}d(e){g(a,f)}})()})();",
    17,
    17,
    "||i|function|debugger|20|length|if|try|constructor|||else|catch||5000|setTimeout".split(
      "|"
    ),
    0,
    {}
  )
);*/

typeof afterload === "function" && afterload();

then = performance.now();
window.requestAnimFrame(Loop);

var ralert = alert,
  rconfirm = confirm;
alert = function() {
  game.key = { left: false, right: false, up: false };
  return ralert(...arguments);
};
confirm = function() {
  game.key = { left: false, right: false, up: false };
  return rconfirm(...arguments);
};
