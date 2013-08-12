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

// Expects one of the following:
//
//   - A filter function that accepts a model + (optional) array of
//     keys to listen to changes for or null)
//   - An object describing a filter
function createFilter(filter, keys) {
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


// Beware of `this`
// All of the following functions are meant to be called in the context
// of the FilteredCollection object, but are not public functions.

function addFilter(filterName, filterObj) {
  this._filters[filterName] = filterObj;
  runFilter.call(this, filterName);
  this.trigger('new-filter', filterName);
}

function removeFilter(filterName) {
  delete this._filters[filterName];
  for (var cid in this._filterResultCache) {
    if (this._filterResultCache.hasOwnProperty(cid)) {
      delete this._filterResultCache[cid][filterName];
    }
  }
  this.trigger('filter-removed', filterName);
}

function runFilter(filterName) {
  this._superset.each(function(model) {
    runFilterOnModel.call(this, filterName, model);
  }, this);
}

function runFilters() {
  _.each(this._filters, function(val, filterName) {
    runFilter.call(this, filterName);
  }, this);
}

function runFiltersOnModel(model, changes) {
  this._filterResultCache[model.cid] = {};
  _.each(this._filters, function(filterObj, filterName) {
    runFilterOnModel.call(this, filterName, model, changes);
  }, this);
}

function runFilterOnModel(filterName, model, changes) {
  var filterObj = this._filters[filterName];

  if (_.isArray(changes) && _.isArray(filterObj.keys)) {
    var results = _.map(changes, function(key) {
      return _.contains(filterObj.keys, key);
    });

    if (!_.any(results) && _.has(this._filterResultCache[model.cid], filterName)) {
      return this._filterResultCache[model.cid][filterName];
    }
  }

  if (!this._filterResultCache[model.cid]) {
    this._filterResultCache[model.cid] = {};
  }
  this._filterResultCache[model.cid][filterName] = filterObj.fn(model);
}

function filterFunction(model) {
  // We only want to check the current filters
  for (var filterName in this._filters) {
    if (!this._filterResultCache[model.cid][filterName]) {
      return false;
    }
  }
  return true;
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

function onModelChange(model) {
  var changes = _.keys(model.changed);
  runFiltersOnModel.call(this, model, changes);
  filter.call(this);
}

function onModelAdd(model) {
  runFiltersOnModel.call(this, model);
  filter.call(this);
  this.length = this._collection.length;
}

function onModelRemove(model) {
  if (this.contains(model)) {
    this._collection.remove(model);
  }
  this.length = this._collection.length;
}

function Filtered(superset, CollectionType) {
  // Allow the user to pass in a custom Collection type
  CollectionType = CollectionType || Backbone.Collection;

  // Save a reference to the original collection
  this._superset = superset;

  // The idea is to keep an internal backbone collection with the filtered
  // set, and expose limited functionality.
  this._collection = new CollectionType(superset.toArray());

  // Set up the filter data structures
  this.resetFilters();

  // A drawback is that we will have to update the length ourselves
  // every time we modify this collection.
  this.length = this._collection.length;

  this.on('change', filter, this);
  this._superset.on('reset', filter, this);
  this._superset.on('add', onModelAdd, this);
  this._superset.on('change', onModelChange, this);
  this._superset.on('remove', onModelRemove, this);
}

var methods = {

  defaultFilterName: '__default',

  filterBy: function(filterName, filter, keys) {
    // Allow the user to skip the filter name if they're only using one filter
    if (!filter) {
      filter = filterName;
      filterName = this.defaultFilterName;
    }

    addFilter.call(this, filterName, createFilter(filter, keys));
    
    this.trigger('change');
    return this;
  },

  removeFilter: function(filterName) {
    if (!filterName) {
      filterName = this.defaultFilterName;
    }

    removeFilter.call(this, filterName);

    this.trigger('change');
    return this;
  },

  resetFilters: function() {
    this._filters = {};
    this._filterResultCache = {};
    this._collection.each(function(model) {
      this._filterResultCache[model.cid] = {};
    }, this);

    this.trigger('change');
    return this;
  },

  superset: function() {
    return this._superset;
  },

  refilter: function(arg) {
    if (typeof arg === "string" && this._filters[arg]) {
      // refilter that filter function
      runFilter.call(this, arg);
    } else if (typeof arg === "object" && arg.cid) {
      // is backbone model, refilter that one
      onModelChange.call(this, arg);
    } else if (!arg) {
      // refilter everything
      runFilters.call(this);
    }
    this.trigger('change');
    return this;
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

