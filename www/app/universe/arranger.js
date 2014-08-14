/**
 * Determines the layout of the universe by gathering historical build/job times
 * and then laying things out based on that info.
 *
 * ### Units / Distance / Scaling ###
 *
 * Our units in all cases are seconds, as in time.  Which may be confusing to
 * you if you have ever thought about arc-seconds and stuff like that.  But if
 * you are fancy like that you probably could be doing something more useful
 * than hacking on this...
 *
 * The time we are talking about is *running* time, the time it takes to
 * accomplish something once it starts.  Obviously, if you have to wait in line
 * 6 hours for a physical Android device, that sucks and impacts when you can
 * expect to see your test results, but it's highly dependent on the number of
 * other jobs going on.
 *
 * However, since the wait is useful info, we map it to the radius of the size
 * of a planetoid with a logarithmic scale after some minimum so we have some
 * space to put the name.  This might make some sense with gravity if it weren't
 * for the fact that the problem is our conceptual target moon, not the origin
 * moon where the rocket comes from.  The larger moon does give us more space
 * to display things on its surface that indicate people are waiting for a
 * rocket to show up.  Landing cradles?  Impatient people?  Dunno.
 *
 * ### Coordinate Space and Transforms ###
 *
 * The center of the build planet in each system has position 0,0.  All the
 * positions in the system are relative to that since all of the other things in
 * the system are dependent on the build planet and therefore it basically is
 * their origin point.
 *
 * ### The Circle of Rocket Life ###
 *
 * Rockets start out in the "VCS" system launching from planet "git" or "hg" or
 * something like that.  This is conceptually amusing, but it might need to be
 * changed to something involving more planets/moons/etc. for the purposes of
 * spreading out the rocket paths
 *
 * Rockets next travel to "build" moons surrounding the planet "build" in
 * whatever platform-named system they're traveling to.  So for example we have
 * the "linux" system with the planet "build" which then would have moons named
 * "opt32", "opt64", "asan64", etc.
 *
 * Once builds complete, rockets fly from their build planets to their test
 * planets.
 *
 * An important cheat we do right now is that we don't actually understand the
 * task dependency graph.  It's my understanding that the new taskcluster work
 * will make all that stupidly easy for us to understand, but we don't bother
 * right now.  In most cases everybody lives inside their specific "platform"
 * so it doesn't matter.  But there are clearly oddities like the Windows 7/8
 * platforms where there's no build.  There's either a configuration problem
 * or they're reusing the XP builds or something.  But that doesn't matter to
 * us!  So test rockets take off from the windows 8 planet without anyone
 * landing on it?  They probably have some robots down there.  Or space ghosts!
 *
 * ### Estimated Job Durations ###
 *
 * treeherder-service has our back on this one.  It computes an average job
 * running time as running_eta.  So if we're "live" we don't need to compute
 * anything ourselves.  However if we're doing a replay, we just compute the
 * average times ourselves from the actual data.
 *
 * ### Positioning Planets and Moons ###
 *
 * The build planet is a gimme since we know exactly where to position it.  But
 * for all the rest, we have to deal with the fact that there can be a wide
 * degree of variability in the test moons since they are only conceptually
 * related.
 *
 * Our solution is to control the variability by kicking out all the slow moons
 * to live around a new planet called "Slow" that captured the sucky far-away
 * moons from their rightful place in the sky.  We determine slow by computing
 * the average, kicking out things slower by a factor of some number of standard
 * deviations to circle "Slow", and then re-computing the average and just using
 * that as the desired distance/position of the planet.  We sort the planets by
 * their distance, then position them, then let them position their moons.
 **/

define(function(require) {

var d3 = require('d3');

/**
 * The nodes in the great celestial hierarchy of the universe.
 */
function Celestial(opts) {
  /** star, planet, moon, station */
  this.type = opts.type || 'unknown';
  this.name = opts.name || ('unexplored ' + this.type);

  /** Moons have jobTypes */
  this.jobType = opts.jobType || null;

  /** What Celestial do we ourselves orbit?  null if we're the star */
  this.parent = opts.parent || null;
  /** What things are orbiting us? */
  this.kids = opts.kids || [];
  this.kidsByName = {};

  /**
   * Did we have things that would have orbited us but we exiled them to live
   * far, far away?  (Or rather they were captured by the sucky "Slow" planet.)
   */
  this.exiled = opts.exiled || [];

  this.rocketsFrom = opts.rocketsFrom || [];
  this.rocketsTo = opts.rocketsTo || [];

  this.x = 0;
  this.y = 0;
  this.radius = 0;
}
Celestial.prototype = {
  computeAverageOfKids: function(accessor) {
    return d3.mean(this.kids, accessor);
  },
};

/**
 * Layout out the universe based on the resultSets (pushes) provided.
 *
 * We layout systems before we position them.  We layout the build planet and
 * its moons, then we position the other planets in the system, then their
 * moons.
 *
 * @param resultSets
 * @param opts
 * @param {Boolean} [opts.useEstimates=false]
 *   If true, indicates we should use the estimates provided.
 */
function UniverseArranger(resultSets, opts) {
  /** Proper star systems */
  this.systems = [];
  /** Random stuff that lives outside of systems */
  this.deepSpaceJunk = [];
}
UniverseArranger.prototype = {

  /**
   * Position the moons around their already-positioned planet.
   */
  _positionMoons: function(planet) {
    // Sort the moons by ETA
    function compareETAs(a, b) {
      return a.jobType.runningETA - b.jobType.runningETA;
    }
    function getETA(moon) {
      return moon.jobType.runningETA;
    }
    planet.kids.sort(compareETAs);


  },

  _positionPlanet: function(planet, angle) {
  },

  /**
   * Calculate the size of each system.
   *
   * We put our fastest build as the moon closest to the home system and the
   * longest/slowest test on the exact opposite side of the system.  We can
   * then use the relative build times of the other moons to position them
   * around their planet.
   */
  _sizeSystems: function() {
  },

  /**
   * Position systems based on their sizes.
   */
  _positionSystems: function() {
  },

  /**
   * Arrange the stuff inside a system.
   */
  _layoutSystem: function(system) {
    var buildPlanet = system.namedKids['Build'];
    // we actually already put everyone at 0,0.  Yay!



  },

  arrange: function() {
    this.systems.forEach(function(system) {
      this._layoutSystem(system);
    }.bind(this));
    this._positionSystems();
  },
};

return {
};

}); // end define
