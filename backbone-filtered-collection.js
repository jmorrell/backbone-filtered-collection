/*! backbone-filtered-collection v0.0.0 - MIT license */
;(function (root) { function moduleDefinition(Backbone, _) {

  /*

function initialize(models, options) {
  this._superset = options.superset;
  this.on('change', filter, this);

  this.filters = {};

  bindToParentCollection.call(this);
  filter.call(this);
}

function bindToParentCollection() {
  this._superset.on('change reset add', this._filter, this);
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
  if (this._superset) {
    filtered = this._superset.filter(_.bind(filterFunction, this));
  }

  this.reset(filtered);
}

function Filtered(superset) {
  this._superset = superset;
  this.filters = {};

  this.on('change', filter, this);
  this._superset.on('change reset add', filter, this);
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
  },

  superset: function() {
    return this._superset;
  }

});
*/

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

var methods = {

  filterBy: function(filterName, filter) {
    if (!filter) {
      filter = filterName;
      filterName = "__default";
    }

    if (_.isFunction(filter)) {
      this._filters[filterName] = filter;
    } else if (_.isObject(filter)) {
      this._filters[filterName] = function(model) {
        for (var key in filter) {
          if (filter[key] !== model.get(key)) {
            return false;
          }
        }
        return true;
      };
    }

    this.trigger('change');

    return this;
  },

  removeFilter: function(filterName) {
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
  'each', 'slice', 'where', 'findWhere'
];

_.each(collectionMethods, function(method) {
  methods[method] = function() {
    return Backbone.Collection.prototype[method].apply(this._collection, arguments);
  };
});






_.extend(Filtered.prototype, methods, Backbone.Events);
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

