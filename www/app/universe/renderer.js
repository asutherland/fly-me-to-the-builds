/**
 * Render the Universe and its many rockets.
 *
 * Rendering layers:
 * - Rocket routes
 * - Celestial bodies
 * - Rockets
 **/

define(function(require) {

var d3 = require('d3');

/**
 * It's the MIT-licensed octicon rocket icon.  Hooray friendly people who can
 * draw stuff and make the results freely reusable!  Hooray!
 *
 * https://github.com/github/octicons/blob/master/svg/rocket.svg
 */
var ROCKET_PATH = 'M716.737 124.05600000000004c-71.926 41.686-148.041 96.13-218.436 166.555-45 45.031-81.213 88.78-110.39 129.778L209.538 453.35 0.047 662.997l186.818 5.815 131.562-131.562c-46.439 96.224-50.536 160.019-50.536 160.019l58.854 58.792c0 0 65.827-6.255 162.737-53.163L355.107 837.119l5.88 186.881 209.585-209.521 33.086-179.252c41.403-29.02 85.185-65.046 129.716-109.545 70.425-70.455 124.837-146.541 166.555-218.466-45.97-9.351-88.125-28.488-121.397-61.668C745.257 212.18100000000004 725.994 170.02499999999998 716.737 124.05600000000004zM786.161 86.84299999999996c5.004 45 19.952 81.274 44.78 105.98 24.769 24.985 60.98 39.902 106.138 44.844C1003.063 104.32299999999998 1023.953 0 1023.953 0S919.63 20.857999999999947 786.161 86.84299999999996z';
/**
 * The rocket's path makes it look like it's pointed at 45 degrees, so to get it
 * pointed at 0 degrees (rightwards), we need to subtract that off.
 */
var ROCKET_RAD_ADJ = -Math.PI / 4;

function UniverseRenderer(opts) {
  this.universe = opts.universe;
  this.jobs = opts.jobs;

  this.renderNode = opts.renderNode;
  this.root = d3.select(opts.renderNode).append('svg');
  this.routeRoot = this.root.append('g');
  this.bodiesRoot = this.root.append('g');
  this.rocketsRoot = this.root.append('g');
}
UniverseRenderer.prototype = {

  computeRoutes: function() {

  },

  /**
   * Compute and render the rocket routes both so we can display them and so the
   * rockets can reuse them.  (The SVG DOM can do path interpolation for us
   * even though d3 itself cannot!)
   *
   * We assume all planets spin clockwise and we're looking at them from one of
   * their poles.  Because of this and because all rockets also are expected
   * to be flying right/east, they want to launch up/north so they have that
   * nice spinny motion to help themselves out velocity-wise.  When it comes
   * to landing, rockets are lazy.  They just want to smash into, er, land
   * on the planet as directly as possible.  Probably.  It's like I'm actively
   * trying to be lazy now.
   *
   * Really, I'll just play with stuff once it works until it looks not
   * entirely stupid.  Maybe we'll add a lot of way-points and fake asteroids
   * fields to rationalize non-efficient courses, etc.
   */
  renderRoutes: function() {
  },

  renderCelestialBodies: function() {
    this.bodiesRoot.select('.celestial')
      .data(this.universe.descendants)
      .enter().append('circle')
        .attr('class', function(cel) { return 'celestial ' + cel.type; })
        .attr('cx', function(cel) { return cel.x; })
        .attr('cy', function(cel) { return cel.y; })
        .attr('r',  function(cel) { return cel.r; });
  },

  /**
   *
   */
  renderRockets: function() {
    var rockets = this.Rocketroot.select('.rocket')
      .data(this.jobs);

    rockets.enter().append('path')
      .attr('d', ROCKET_RAD_ADJ);

    rockets
      .attr('transform', function(job) {

        });


  },

  render: function() {
    this.renderCelestialBodies();
  },
};



return {
};

}); // end define
