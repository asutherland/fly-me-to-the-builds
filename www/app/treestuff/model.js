/**
 * Our normalized representations of the data the treeherder server tells us.
 * We are created by `normalizer.js`.
 *
 **/

define(function(require) {

/**
 * Our representation of treeherder's "result set" for specific push.  We call
 * it push because it has less syllables and arguably makes more sense in our
 * constrained context where we don't care about being generic and are far
 * removed from potential ambiguity.
 *
 * @param {Number} opts.id
 *   The id assigned to this "resultset" by the treeherder.  This id is an
 *   arbitrary thing the treeherder server assigned.  It means jack.  But we
 *   use it as our internal id to distinguish
 */
function Push(opts) {
  this.id = opts.id;
  /**
   * All the jobs that ran as a part of this push (that we know about so far.)
   */
  this.jobs = [];
  /**
   * The jobs keyed by their id.  Exist for efficient dynamic updating.
   */
  this.jobsById = {};
}
Push.prototype = {
};

/**
 * The overarching platform (ex: linux) versus the specific platforms from
 * treeherder's perspective which are permutations like "linux32/opt" or
 * "linux64/asan".
 */
function PlatformFamily(opts) {
  this.name = opts.name;
  this.platforms = [];
  this.jobTypeFamilies = [];
}
PlatformFamily.prototype = {
};

/**
 * Specific platform (ex: linux32-opt), currently corresponds exactly to
 * treeherder platforms.
 *
 *
 */
function Platform(opts) {
  /** The PlatformFamily we belong to/are part of. */
  this.family = opts.family;
  this.family.platforms.push(this);
  /** The completely specific name like "linux32-opt" */
  this.fullName = opts.fullName;
  /** The variation that makes us different from our family, like "32-opt" */
  this.shortName = opts.shortName;
  this.info = opts.info;
}
Platform.prototype = {
};

/**
 * A grouping of JobTypes.  But these JobTypes are more than friends, they're
 * family.  Man, this is good coffee.
 *
 *
 */
function JobTypeFamily() {
}
JobTypeFamily.prototype = {
};

/**
 * A type of build/test that can be run.  Jobs are specific runs/instances of
 * our type.  Mochiest 1 would be an example of a JobType.  Mochitest(s) would
 * be an example of a JobTypeFamily.
 */
function JobType(opts) {
  /** Is there a job that gave rise to our job? */
  this.originJobType = opts.originJobType || [];
  /** Job types that are run using the result of our job. */
  this.offspringJobTypes = opts.offspringJobTypes || [];

  this.runningETA;
}
JobType.prototype = {
};

/**
 * Jobs are specific runs/instances of a given job type.
 */
function Job(opts) {
  /** The push that our job was started for. */
  this.push = opts.push;
  /** Our jobType */
  this.jobType = opts.jobType;

  this.update(opts.wireObj);
}
Job.prototype = {
  update: function(wireObj) {
    /** The timestamp of when we were scheduled. */
    this.schedTS;
    /** The timestamp of when we started running. */
    this.startTS;
    /** The timestamp of when we finished running. */
    this.endTS;
  },

  /**
   * Return our progress in the range [0.0, 1.0] for a given timestamp if we
   * existed at that time.  If we didn't exist, null is returned.
   */
  relativeProgressAtTime: function(t) {
  },
};


return {
  Push: Push,
  PlatformFamily: PlatformFamily,
  JobTypeFamily: JobTypeFamily,
  JobType: JobType,
  Job: Job
};

}); // end define
