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
 * The center of the build planet in each system during system layout has
 * position 0,0.  All the positions in the system are relative to that since all
 * of the other things in the system are dependent on the build planet's and
 * therefore it basically is their origin point.
 *
 * After the system is laid out it is relocated by manually transforming all
 * existing coordinates.  Rockets need to cross between systems so they benefit
 * from a unified coordinate space.  Additionally, we do not dynamically apply
 * any transforms; nothing rotates, orbits, or soars majestically through space.
 *
 * ### The Circle of Rocket Life ###
 *
 * Rockets start out in the "VCS" system launching from planet "git" or "hg" or
 * something like that.  This is conceptually amusing, but it might need to be
 * changed to something involving more planets/moons/etc. for the purposes of
 * spreading out the rocket paths.
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
  /** universe, star, planet, moon, station */
  this.type = opts.type || 'unknown';
  this.name = opts.name || ('unexplored ' + this.type);

  /** Moons have jobTypes */
  this.jobType = opts.jobType || null;

  /** What Celestial do we ourselves orbit?  null if we're the star */
  this.parent = opts.parent || null;
  if (opts.parent) {
    this.parent._addKid(this);
  }
  this.descendants = [];

  /** What things are orbiting us? */
  this.kids = [];
  this.kidsByName = {};

  /**
   * Did we have things that would have orbited us but we exiled them to live
   * far, far away?  (Or rather they were captured by the sucky "Slow" planet.)
   */
  this.exiled = opts.exiled || [];

  this.rocketsFrom = opts.rocketsFrom || [];
  this.rocketsTo = opts.rocketsTo || [];

  this.x = 0.0;
  this.y = 0.0;
  this.radius = 0.0;

  this.effectiveDistance = 0.0;
}
Celestial.prototype = {
  _addKid: function(kid) {
    this.kids.push(kid);
    this.kidsByName[kid.name] = kid;
    // walk up the parent chain fill out the descendants sets
    var ancestor = this;
    while (ancestor) {
      ancestor.descendants.push(kid);
      ancestor = ancestor.parent;
    }
  },

  computeAverageOfKids: function(accessor) {
    return d3.mean(this.kids, accessor);
  },

  translateSelfAndDescendants: function(tx, ty) {
    this.x += tx;
    this.y += ty;

    for (var i = 0; i < this.descendants.length; i++) {
      var offspring = this.descendants[i];
      offspring.x += tx;
      offspring.y += ty;
    }
  }
};

function compareETAs(a, b) {
  return a.jobType.runningETA - b.jobType.runningETA;
}
function getETA(moon) {
  return moon.jobType.runningETA;
}
function compareEffectiveDistances() {
}

/**
 * Layout out the universe based on the normalized "PlatformFamily"s provided.
 *
 * We layout systems before we position them.  We layout the build planet and
 * its moons, then we position the other planets in the system, then their
 * moons.
 *
 * @param opts
 * @param {PlatformFamily[]} opts.platformFamilies
 *   The platform families that will become our systems.  They contain within
 *   them all the information we need to birth a fantastic new universe of
 *   rocket ships just exploding all over the place.  Like horrible, horrible
 *   fireworks.
 */
function UniverseArranger(opts) {
  this.platformFamilies = opts.platformFamilies;

  /** Proper star systems */
  this.universe = new Celestial({
    type: 'universe',
    name: opts.universeName || 'Universe',
  });


  this._mapPlatformFamiliesToSystems();
}
UniverseArranger.prototype = {
  //////////////////////////////////////////////////////////////////////////////
  // Building Celestial instances from treestuff's models

  _mapJobTypeFamilyToPlanet: function(system, jobTypeFamily) {
    var planet = new Celestial({
      type: 'planet',
      name: jobTypeFamily.name
    });
  },

  /**
   * Give a PlatformFamily, create a 'star' system for it, recursively mapping
   * sub-stuff.
   */
  _mapPlatformFamilyToSystem: function(platformFamily) {
    var system = new Celestial({
      type: 'star',
      name: platformFamily.name,
      // you can't land on a star! (which is what a jobType means)
      jobType: null,
      parent: this.universe,
    });

    // Celestial instances self-link into their parent.
    platformFamily.jobTypeFamilies.forEach(
      this._mapJobTypeFamilyToPlanet.bind(this, system));

    return system;
  },

  _mapPlatformFamiliesToSystems: function() {
    this.systems = this.platformFamilies.map(
                     this._mapPlatformFamilyToSystem.bind(this));
  },

  //////////////////////////////////////////////////////////////////////////////
  // Arranging


  /**
   * Position the moons around their already-positioned planet (meaning x, y,
   * radius, and effectiveDistance have been set.)
   */
  _positionMoons: function(planet) {
    // Sort the moons by ETA
    planet.kids.sort(compareETAs);

    var angleStep = Math.PI * 2 / planet.kids.length;
    var angles = [Math.PI];
    var numOffAxis = planet.kids.length - 2;
    for (var i = 0, j = 0; i < numOffAxis; i += 2, j++) {
      angles.push(Math.PI - angleStep * j);
      if (i + 1 < numOffAxis) {
        angles.push(Math.PI + angleStep * j);
      }
    }
    angles.push(0);

    planet.kids.forEach(function(moon, iMoon) {
      var angle = angles[iMoon];
      var dist = 60;
      moon.x = planet.x + dist * Math.cos(angle);
      moon.y = planet.y + dist * Math.sin(angle);
    });
  },

  _positionPlanet: function(planet, angle) {
  },

  /**
   * Arrange the stuff inside a system.
   */
  _layoutSystem: function(system) {
    // -- Build Planet first!
    // The build planet defines the origin point of the system.
    var buildPlanet = system.kidsByName['Build'];
    buildPlanet.x = 0;
    buildPlanet.y = 0;

    // Like all planets/moons, the planet wants to live at the average of the
    // moon's running times.  So we compute that and that lets us figure out how
    // to position the moons.
    buildPlanet.effectiveDistance = buildPlanet.computeAverageOfKids(getETA);

    this._positionMoons(buildPlanet);

    // -- The other planets
    var otherPlanets = system.kids.filter(function(planet) {
      return planet !== buildPlanet;
    });

    var suckyPlanet = null;
    function makeSuckyPlanet() {
      suckyPlanet = new Celestial({
      });
    }

    // Find the averages, kick out sucky moons to the sucky planet
    otherPlanets.forEach(function() {

    }.bind(this));

  },

  /**
   * Position systems based on their sizes.
   */
  _positionSystems: function() {
  },

  arrange: function() {
    this.systems.forEach(function(system) {
      this._layoutSystem(system);
    }.bind(this));
    this._positionSystems();
  },
};

return {
  Celestial: Celestial,
  UniverseArranger: UniverseArranger
};

}); // end define
