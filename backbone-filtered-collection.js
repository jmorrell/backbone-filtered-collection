/*! backbone-filtered-collection v0.0.0 - MIT license */
;(function (root) { function moduleDefinition(Backbone, _) {

// TODO: Describe the three otions for filter, and how it works
function convertFilterToFunction(filter) {
  if (_.isFunction(filter)) {
    return filter;
  } else if (_.isObject(filter)) {
    return function(model) {
      for (var key in filter) {
        if (_.isFunction(filter[key])) {
          if (!filter[key](model.get(key))) {
            return false;
          }
        } else {
          if (filter[key] !== model.get(key)) {
            return false;
          }
        }
      }
      return true;
    };
  }
}

function filterFunction(model) {
  var bools = _.map(this._filters, function(filter, key) {
    return filter(model);
  });

  // The model passes if all of the tests were `true`, false otherwise.
  // This will return true when bools is an empty array.
  return _.all(bools, _.identity);
}

function filter() {
  var filtered = [];
  
  // Filter the collection
  if (this._superset) {
    filtered = this._superset.filter(_.bind(filterFunction, this));
  }

  this._collection.reset(filtered);
  this.length = this._collection.length;
}

function Filtered(superset) {
  this._superset = superset;
  this._filters = {};

  // The idea is to keep an internal backbone collection with the filtered
  // set, and expose limited functionality.
  this._collection = new Backbone.Collection(superset.toArray());
  this.length = this._collection.length;

  this.on('change', filter, this);
  this._superset.on('change reset add', filter, this);
}

var parameters = {
  defaultFilterName: '__default'
};

var methods = {

  filterBy: function(filterName, filter) {
    // Allow the user to skip the filter name if they're only using one filter
    if (!filter) {
      filter = filterName;
      filterName = this.defaultFilterName;
    }

    this._filters[filterName] = convertFilterToFunction(filter);

    this.trigger('change');
    return this;
  },

  removeFilter: function(filterName) {
    if (!filterName) {
      filterName = this.defaultFilterName;
    }
    delete this._filters[filterName];

    this.trigger('change');
    return this;
  },

  resetFilters: function() {
    this._filters = {};

    this.trigger('change');
    return this;
  },

  superset: function() {
    return this._superset;
  }

};

// Methods on `this._collection` we will expose to the outside world
var collectionMethods = [
  'toJSON', 'first', 'last', 'at', 'get', 'map',
  'each', 'slice', 'where', 'findWhere', 'contains'
];

_.each(collectionMethods, function(method) {
  methods[method] = function() {
    return Backbone.Collection.prototype[method].apply(this._collection, arguments);
  };
});

_.extend(Filtered.prototype, methods, Backbone.Events);
_.extend(Filtered, parameters);
Filtered.extend = Backbone.Collection.extend;
return Filtered;

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

