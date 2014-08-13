/**
 * Fetch
 **/

define(function(require) {

var DEFAULT_TREEHERDER_SERVER = 'https://treeherder.mozilla.org';

var Normalizer = require('./normalizer').Normalizer;

function commonLoad(url, responseType) {
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = responseType;
    req.addEventListener('load', function() {
      if (req.status == 200)
        resolve(req.response);
      else
        reject(req.status);
    }, false);
    req.addEventListener('timeout', function() {
      reject('timeout');
    });
    req.timeout = 30 * 1000;
    req.send(null);
  });
}


/**
 * @param opts
 * @param {String} [opts.server]
 *   The treeherder server to fetch data from.
 * @param {String} opts.repoName
 *   The name of the repository we'll be getting our data from.
 */
function RepoGrabber(opts) {
  this.server = opts.server || DEFAULT_TREEHERDER_SERVER;
  this.repoName = opts.repoName;

  this.normalizer = null;
}
RepoGrabber.prototype = {
  _urlForHashWithJobs: function(hash) {
    return this.server +
      '/api/project/' + this.repoName + '/resultset/' +
      '?count=1&format=json&full=true&with_jobs=true&revision=' +
      hash;
  },

  grabPush: function(hash) {
    return commonLoad(this._urlForHashWithJobs(hash), 'json')
      .then(function(obj) {
        if (!this.normalizer) {
          this.normalizer = new Normalizer({
            jobPropertyNames: obj.job_property_names
          });
        }

        // XXX handle empty response
        return this.normalizer.normalizePush(obj.results[0]);
      }.bind(this));
  },

  grabPushes: function(hashes) {
    return Promise.all(hashes.map(this.grabPush.bind(this)));
  },
};

return {
  RepoGrabber: RepoGrabber
};

}); // end define
