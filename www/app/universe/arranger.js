/**
 * Determines the layout of the universe by gathering historical build/job times
 * and then laying things out based on that info.
 *
 * Our units in all cases are seconds, as in time.  Which may be confusing to
 * you if you have ever thought about arc-seconds and stuff like that.  But if
 * you are fancy like that you probably could be doing something more useful
 * than hacking on this...
 *
 * ### Job Durations ###
 * treeherder-service has our back on this one.  It computes an average job
 * running time as running_eta.  So if we're "live" we don't need to compute
 * anything ourselves.  However if we're doing a replay, we just compute the
 * average times ourselves from the actual data.
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
 **/

define(function(require) {

/**
 * The nodes in the great celestial hierarchy of the universe.
 */
function Celestial(opts) {
  /** star, planet, moon, station */
  this.type = opts.type || 'unknown';
  this.name = opts.name || ('unexplored ' + this.type);
  /** What Celestial do we ourselves orbit?  null if we're the star */
  this.orbits = opts.orbits || null;
  /** What things are orbiting us? */
  this.orbitedBy = opts.orbitedBy || [];

  this.rocketsFrom = opts.rocketsFrom || [];
  this.rocketsTo = opts.rocketsTo || [];

  this.x = 0;
  this.y = 0;
  this.radius = 0;
}
Celestial.prototype = {
};

/**
 * Layout out the universe based on the resultSets (pushes) provided.
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
   * Calculate the size of each system.
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
  _layoutSystem: function() {
  },
};

return {
};

}); // end define
