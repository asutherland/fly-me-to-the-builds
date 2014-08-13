/**
 * The potentially brittle part where we establish semantic hierarchies that the
 * treeherder doesn't care about.  We also will do some name transformations to
 * suit our ontological commitment (hah! (inside reference)).
 *
 * Our rocket rules
 **/

define(function(require) {

/**
 * @param opts
 * @param {String[]} opts.jobPropertyNames
 *   The job_property_names result array from a treeherder response.
 */
function Normalizer(opts) {
  this.jobPropertyNames = opts.jobPropertyNames;

  this.platformFamilies = [];
  this._platformIdToFamily = {};
}
Normalizer.prototype = {
  _normalizeJob: function(rawJobArr) {
    var propNames = this.jobPropertyNames;
    var wireObj = {};
    for (var i = 0; i < propNames.length; i++) {
     wireObj[propNames[i]] = rawJobArr[i];
    }


  },

  normalizePush: function() {
    // -- job_counts: don't care!
    // -- revisions: TODO
    // -- platforms
    // platforms is an array of { groups, name, option }
    // where groups is an array of { jobs, name, symbol }

  },
};


return {
  Normalizer: Normalizer
};

}); // end define
