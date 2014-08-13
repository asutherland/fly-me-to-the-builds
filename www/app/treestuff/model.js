/**
 * Our normalized representations of the data the treeherder server tells us.
 * We are created by `normalizer.js`.
 *
 **/

define(function(require) {

function Push() {
}
Push.prototype = {
};

/**
 * The overarching platform (ex: linux) versus the specific platforms from
 * treeherder's perspective which are permutations like "linux32/opt" or
 * "linux64/asan".
 */
function PlatformFamily(opts) {
}
PlatformFamily.prototype = {
};

/**
 * A type of build/test that can be run.  Jobs are specific runs/instances of
 * our type.
 */
function JobType(opts) {
  /** Job types that are run using the result of our job. */
  this.offspringJobTypes = opts.offspringJobTypes || [];
}
JobType.prototype = {
};

/**
 * Jobs are specific runs/instances of a given job type.
 */
function Job(opts) {
  this.startTS;
  this.endTS;
}
Job.prototype = {
  /**
   * Return our progress in the range [0.0, 1.0] for a given timestamp if we
   * existed at that time.  If we didn't exist, null is returned.
   */
  relativeProgressAtTime: function(t) {
  },
};


return {
  Push: Push,
  JobType: JobType,
  Job: Job
};

}); // end define
