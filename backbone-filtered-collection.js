/*! backbone-filtered-collection v0.0.0 - MIT license */
;(function (root) { function moduleDefinition(Backbone, _) {


// Converts a key and value into a function that accepts a model
// and returns a boolean.
function convertKeyValueToFunction(key, value) {
  return function(model) {
    return model.get(key) === value;
  };
}

// Converts a key and an associated filter function into a function
// that accepts a model and returns a boolean.
function convertKeyFunctionToFunction(key, fn) {
  return function(model) {
    return fn(model.get(key));
  };
}

// Accepts an object in the form of:
//
//   {
//     key: value,
//     key: function(val) { ... }
//   }
//
// and turns it into a function that accepts a model an returns a
// boolean + a list of the keys that the function depends on.
function createFilterFromObject(filterObj) {
  var keys = _.keys(filterObj);

  var filterFunctions = _.map(keys, function(key) {
    var val = filterObj[key];
    if (_.isFunction(val)) {
      return convertKeyFunctionToFunction(key, val);
    }
    return convertKeyValueToFunction(key, val);
  });

  // Iterate through each of the generated filter functions. If any
  // are false, kill the computation and return false. The function
  // is only true if all of the subfunctions are true.
  var filterFunction = function(model) {
    for (var i = 0; i < filterFunctions.length; i++) {
      if (!filterFunctions[i](model)) {
        return false;
      }
    }
    return true;
  };

  return createFilterObject(filterFunction, keys);
}

function createFilterObject(filterFunction, keys) {
  // Make sure the keys value is either an array or null
  if (!_.isArray(keys)) {
    keys = null;
  }
  return { fn: filterFunction, keys: keys };
}

// TODO: Describe the three otions for filter, and how it works
function convertFilterToFunction(filter, keys) {
  // This must go first because _.isObject(fn) === true
  if (_.isFunction(filter)) {
    return createFilterObject(filter, keys);
  }

  // If the filter is an object describing a filter, generate the
  // appropriate function.
  if (_.isObject(filter)) {
    return createFilterFromObject(filter);
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

function Filtered(superset, CollectionType) {
  // Allow the user to pass in a custom Collection type
  CollectionType = CollectionType || Backbone.Collection;

  // Save a reference to the original collection
  this._superset = superset;

  // This is where we will register our filter functions
  this._filters = {};

  // The idea is to keep an internal backbone collection with the filtered
  // set, and expose limited functionality.
  this._collection = new CollectionType(superset.toArray());

  // A drawback is that we will have to update the length ourselves
  // every time we modify this collection.
  this.length = this._collection.length;

  this.on('change', filter, this);
  this._superset.on('change reset add', filter, this);
}

var methods = {

  defaultFilterName: '__default',

  filterBy: function(filterName, filter, keys) {
    // Allow the user to skip the filter name if they're only using one filter
    if (!filter) {
      filter = filterName;
      filterName = this.defaultFilterName;
    }

    this._filters[filterName] = convertFilterToFunction(filter, keys).fn;

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
  },

  refilter: function(arg) {
    if (typeof arg === "string") {
      // refilter that filter function
    } else if (typeof arg === "object" && arg.cid) {
      // is backbone model, refilter that one
    } else if (!arg) {
      // refilter everything
    }
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

// Build up the prototype
_.extend(Filtered.prototype, methods, Backbone.Events);

// Expose the Backbone extend function
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

