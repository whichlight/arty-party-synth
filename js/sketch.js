var context;
var $fun;
var synth;
var graphic;
var noteVal = 400;
var t = new Date();
var hammertime;
    var prevent_scroll_drag = true;
var two;



var accelEvent;
var orientEvent;
var accelVal;
var base_color = Math.random();

var q_notes = [146.832, 164.814, 174.614, 195.998, 220.000,
246.942, 261.626, 293.665, 329.628, 349.228, 391.995, 440.000, 493.883, 523.251, 587.330, 659.255, 698.456, 783.991, 880.000, 987.767, 1046.502, 1174.659, 1318.510, 1396.913, 1567.982, 1760.000, 1975.533, 2093.005, 2349.318, 2637.020, 2793.826, 3135.963, 3520.000]


/**
 *
 accel events and touch mapped to Synth and Graphic
 Synth plays notes
 Graphic does visuals
 *
 */

$(document).ready(function(){
  setup();
});

$("#press").css('top',$(window).height()/2);
$("#logval").css('top',$(window).height()/4);

var checkFeatureSupport = function(){
  try{
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    context = new AudioContext();
  }
  catch (err){
    alert('web audio not supported');
  }

  if (!window.DeviceMotionEvent) {
    alert("DeviveMotionEvent not supported");
  }
}


var setup = function(){
  checkFeatureSupport();
  synth = new Synth();
  graphic = new Graphic();
  $fun = document.getElementById("fun");
  //add events
  hammertime = Hammer($fun, {
    prevent_default: true,
    no_mouseevents: true
  })
  .on('touch', function(event){
    console.log('touch');
    touchActivate(event);
  })
  .on('drag', function(event){
    touchActivate(event);
  })
  .on('release', function(event){
    touchDeactivate();
  });

  var elem = document.getElementById('fun').children[0];
  var params = { width: $(window).width(), height: $(window).height()};
  two = new Two(params).appendTo(elem);

  var rect = two.makeRectangle(two.width/2, two.height/2, 200, 200);
  rect.fill = "#000";
  rect.opacity = 0.5;
  two.update();

  function draw(){
    synth.playNote();
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}


//touch and gesture mappings to synth and graphic
//
var touchActivate = function(event){
  var c = event.gesture.center;
  var x = c.pageX;
  var y = c.pageY;
  //$("#press").html(x + ", "+y + ", "+ $(window).width()+", "+$(window).height() );
  $("#press").html("");
 var xRatio = x/$(window).width();
  var yRatio = y/$(window).height();
  synth.touchActivate(xRatio,yRatio);
  graphic.touchActivate(xRatio,yRatio);
}

var touchDeactivate = function(){
  synth.touchDeactivate();
  graphic.touchDeactivate();
}

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function Pluck(f){
  this.filter;
  this.gain;
  this.osc;
  this.played = false;
  this.volume = 0.5;
  this.pitch = f;
  this.buildSynth();
  this.duration = 0.1;
}

Pluck.prototype.buildSynth = function(){
  this.osc = context.createOscillator(); // Create sound source
  this.osc.type = 2; // Square wave
  this.osc.frequency.value = this.pitch;

  this.filter = context.createBiquadFilter();
  this.filter.type = 0;
  this.filter.frequency.value = 1000;

  this.gain = context.createGainNode();
  this.gain.gain.value = this.volume;
  //decay
  this.osc.connect(this.filter); // Connect sound to output
  this.filter.connect(this.gain);
  this.gain.connect(context.destination);
}

Pluck.prototype.setPitch = function(p){
  this.osc.frequency.value = p;
}

Pluck.prototype.setFilter = function(f){
  this.filter.frequency.value = f;
}

Pluck.prototype.setVolume= function(v){
  this.gain.gain.value = v;
  this.volume = v;
}

Pluck.prototype.play = function(dur){
  var dur = this.duration || dur;
  this.osc.noteOn(0); // Play instantly
 // this.gain.gain.setTargetValueAtTime(0, 0, 0.3);
  var that = this;
  setTimeout(function(){
  //this looks funny because start and stop don't work on mobile yet
  //and noteOff doesnt allow new notes
    that.setVolume(0);
    that.osc.disconnect();
  },dur*1000);
}

Pluck.prototype.stop = function(){
  return false;
}



function Drone(f){
  this.filter;
  this.gain;
  this.osc;
  this.played = false;
  this.volume = 0.3;
  this.pitch = f;
  this.buildSynth();
  this.play();
}

Drone.prototype.buildSynth = function(){
  this.osc = context.createOscillator(); // Create sound source
  this.osc.type = 2;
  this.osc.frequency.value = this.pitch;

  this.filter = context.createBiquadFilter();
  this.filter.type = 0;
  this.filter.frequency.value = 440;

  this.gain = context.createGainNode();
  this.gain.gain.value = this.volume;
  //decay
  this.osc.connect(this.filter); // Connect sound to output
  this.filter.connect(this.gain);
  this.gain.connect(context.destination);
}

Drone.prototype.setPitch = function(p){
  this.osc.frequency.value = p;
}

Drone.prototype.setFilter = function(f){
  this.filter.frequency.value = f;
}

Drone.prototype.setVolume= function(v){
  this.gain.gain.value = v;
  this.volume = v;
}

Drone.prototype.play = function(){
  this.osc.noteOn(0); // Play instantly
}

Drone.prototype.stop = function(){
    this.setVolume(0);
    this.osc.disconnect();
    return false;
}


function Synth(){
   this.activated =  false;
   this.notes = [220, 440, 880, 880*2];
   this.drones = [];
   this.droneRoot = randArray([146.83, 196, 220.00]);
   this.play_note = true;
}

Synth.prototype.touchActivate= function(x,y){
  this.activated =  true;
  this.x = x;
  this.y = y;
  this.playNote();

}

Synth.prototype.playNote = function(){
  if(this.play_note && this.activated){
    var n = new Pluck(146.83*2);
    n.setPitch(quantize(map_range(this.x, 0,1,100,3000), q_notes));
    n.play();
    this.play_note = false;
    var that = this;
    setTimeout(function(){
      that.play_note = true;
    },this.y*200);
  }
}

Synth.prototype.touchDeactivate= function(){
  this.activated =  false;
  this.drones.forEach(function(d){
    d.stop();
  });
}

var randArray = function(a){
  return a[Math.round(Math.random()*(a.length-1))];
}

var quantize = function(f, notes){
  var qnote = 0;
  notes.some(function(n){
      qnote = n;
      return f < n;
  });
  return qnote;
}

function Graphic(){
  this.activated = false;;
  this.background_color="#BF00FF";
}

Graphic.prototype.touchActivate = function(x,y){
  this.activated = true;
  var col = HSVtoRGB(x/2,1,1);
  var rgb = "rgb("+col.r+","+col.g+","+col.b+")";
console.log(rgb);
  $($fun).css("background-color", rgb);
   // $("#press").html("MOVE");
  //var line = two.makeLine(x*$(window).width(), 0, x*window.width(), $(window).height())
  two.clear();
  two.update();
}

Graphic.prototype.touchDeactivate = function(e){
  this.activated = false;
  $($fun).css("background-color","white");

}


/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR
 * h, s, v
*/
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255)
    };
}



