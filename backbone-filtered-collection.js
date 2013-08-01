/*! backbone-filtered-collection v0.0.0 - MIT license */
;(function (root) { function moduleDefinition(Backbone, _) {
// ---------------------------------------------------------------------------


function initialize(models, options) {
  this.superset = options.superset;
  this.on('change', filter, this);

  this.filters = {};

  bindToParentCollection.call(this);
  filter.call(this);
}

function bindToParentCollection() {
  this.superset.on('change reset add', this._filter, this);
}

function filterFunction(model) {
  var bools = _.map(this.filters, function(filter, key) {
    return filter(model);
  });

  // The model passes if all of the tests were `true`, false otherwise.
  // This will return true when bools is an empty array.
  return _.all(bools, _.identity);
}

function filter() {
  var filtered = [];
  
  // Filter the collection
  if (this.superset) {
    filtered = this.superset.filter(_.bind(filterFunction, this));
  }

  this.reset(filtered);
}

function Filtered(superset) {
  this.superset = superset;
  this.filters = {};

  this.on('change', filter, this);
  this.superset.on('change reset add', filter, this);
}

_.extend(Filtered, {

  filterBy: function(filterName, filter) {
    if (_.isFunction(filter)) {
      this.filters[filterName] = filter;
    } else if (filter.key && filter.expected && _.isFunction(filter.expected)) {
      this.filters[filterName] = function(model, collection, i) {
        return filter.expected(model.get(filter.key), filter.key);
      };
    } else if (filter.key && filter.expected) {
      this.filters[filterName] = function(model, collection, i) {
        return model.get(filter.key) === filter.expected;
      };
    }
    this.trigger('change');

    return this;
  },

  removeFilter: function(filterName) {
    delete this.filters[filterName];
    this.trigger('change');

    return this;
  },

  resetFilters: function() {
    this.filters = {};
    this.trigger('change');

    return this;
  }

});


var FilteredCollection = Filtered;
_.extend(FilteredCollection.prototype, Filtered, Backbone.Collection.prototype);
FilteredCollection.extend = Backbone.Collection.extend;







return FilteredCollection;


// ---------------------------------------------------------------------------
} if (typeof exports === 'object') {
  // node export
  module.exports = moduleDefinition(require('backbone'), require('underscore'));
} else if (typeof define === 'function' && define.amd) {
  // amd anonymous module registration
  define(['backbone', 'underscore'], moduleDefinition);
} else {
  // browser global
  root.FilteredCollection = moduleDefinition(root.Backbone, root._);
}}(this));
