(function(root, factory) {
    if(typeof exports === 'object') {
        module.exports = factory(require('underscore'), require('backbone'));
    }
    else if(typeof define === 'function' && define.amd) {
        define(['underscore', 'backbone'], factory);
    }
    else {
        root.FilteredCollection = factory(root._, root.Backbone);
    }
}(this, function(_, Backbone) {
var require=function(name){return {"backbone":Backbone,"underscore":_}[name];};
require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"cGCOHh":[function(require,module,exports){
var _ = require('underscore');
var Backbone = require('backbone');
var proxyCollection = require('backbone-collection-proxy');
var createFilter = require('./src/create-filter.js');

// Beware of `this`
// All of the following functions are meant to be called in the context
// of the FilteredCollection object, but are not public functions.

function invalidateCache() {
  this._filterResultCache = {};
}

function invalidateCacheForFilter(filterName) {
  for (var cid in this._filterResultCache) {
    if (this._filterResultCache.hasOwnProperty(cid)) {
      delete this._filterResultCache[cid][filterName];
    }
  }
}

function addFilter(filterName, filterObj) {
  // If we've already had a filter of this name, we need to invalidate
  // any and all of the cached results
  if (this._filters[filterName]) {
    invalidateCacheForFilter.call(this, filterName);
  }

  this._filters[filterName] = filterObj;
  this.trigger('filtered:add', filterName);
}

function removeFilter(filterName) {
  delete this._filters[filterName];
  invalidateCacheForFilter.call(this, filterName);
  this.trigger('filtered:remove', filterName);
}

function execFilterOnModel(model) {
  if (!this._filterResultCache[model.cid]) {
    this._filterResultCache[model.cid] = {};
  }

  var cache = this._filterResultCache[model.cid];

  for (var filterName in this._filters) {
    if (this._filters.hasOwnProperty(filterName)) {
      // if we haven't already calculated this, calculate it and cache
      if (!cache.hasOwnProperty(filterName)) {
        cache[filterName] = this._filters[filterName].fn(model);
      }
      if (!cache[filterName]) {
        return false;
      }
    }
  }
  return true;
}

function execFilter() {
  var filtered = [];

  // Filter the collection
  if (this._superset) {
    filtered = this._superset.filter(_.bind(execFilterOnModel, this));
  }

  this._collection.reset(filtered);
  this.length = this._collection.length;
}

function onAddChange(model) {
  // reset the cached results
  this._filterResultCache[model.cid] = {};

  if (execFilterOnModel.call(this, model)) {
    if (!this._collection.get(model.cid)) {
      var index = this.superset().indexOf(model);

      // Find the index at which to insert the model in the
      // filtered collection by finding the index of the
      // previous non-filtered model in the filtered collection
      var filteredIndex = null;
      for (var i = index - 1; i >= 0; i -= 1) {
        if (this.contains(this.superset().at(i))) {
          filteredIndex = this.indexOf(this.superset().at(i)) + 1;
          break;
        }
      }
      filteredIndex = filteredIndex || 0;

      this._collection.add(model, { at: filteredIndex });
    }
  } else {
    if (this._collection.get(model.cid)) {
      this._collection.remove(model);
    }
  }
  this.length = this._collection.length;
}

// This fires on 'change:[attribute]' events. We only want to
// remove this model if it fails the test, but not add it if
// it does. If we remove it, it will prevent the 'change'
// events from being forwarded, and if we add it, it will cause
// an unneccesary 'change' event to be forwarded without the
// 'change:[attribute]' that goes along with it.
function onModelAttributeChange(model) {
  // reset the cached results
  this._filterResultCache[model.cid] = {};

  if (!execFilterOnModel.call(this, model)) {
    if (this._collection.get(model.cid)) {
      this._collection.remove(model);
    }
  }
}

function onAll(eventName, model, value) {
  if (eventName.slice(0, 7) === "change:") {
    onModelAttributeChange.call(this, arguments[1]);
  }
}

function onModelRemove(model) {
  if (this.contains(model)) {
    this._collection.remove(model);
  }
  this.length = this._collection.length;
}

function Filtered(superset) {
  // Save a reference to the original collection
  this._superset = superset;

  // The idea is to keep an internal backbone collection with the filtered
  // set, and expose limited functionality.
  this._collection = new Backbone.Collection(superset.toArray());
  proxyCollection(this._collection, this);

  // Set up the filter data structures
  this.resetFilters();

  this.listenTo(this._superset, 'reset sort', execFilter);
  this.listenTo(this._superset, 'add change', onAddChange);
  this.listenTo(this._superset, 'remove', onModelRemove);
  this.listenTo(this._superset, 'all', onAll);
}

var methods = {

  defaultFilterName: '__default',

  filterBy: function(filterName, filter) {
    // Allow the user to skip the filter name if they're only using one filter
    if (!filter) {
      filter = filterName;
      filterName = this.defaultFilterName;
    }

    addFilter.call(this, filterName, createFilter(filter));

    execFilter.call(this);
    return this;
  },

  removeFilter: function(filterName) {
    if (!filterName) {
      filterName = this.defaultFilterName;
    }

    removeFilter.call(this, filterName);

    execFilter.call(this);
    return this;
  },

  resetFilters: function() {
    this._filters = {};
    invalidateCache.call(this);

    this.trigger('filtered:reset');

    execFilter.call(this);
    return this;
  },

  superset: function() {
    return this._superset;
  },

  refilter: function(arg) {
    if (typeof arg === "object" && arg.cid) {
      // is backbone model, refilter that one
      onAddChange.call(this, arg);
    } else {
      // refilter everything
      invalidateCache.call(this);
      execFilter.call(this);
    }

    return this;
  },

  getFilters: function() {
    return  _.keys(this._filters);
  },

  hasFilter: function(name) {
    return _.contains(this.getFilters(), name);
  },

  destroy: function() {
    this.stopListening();
    this._collection.reset([]);
    this._superset = this._collection;
    this.length = 0;

    this.trigger('filtered:destroy');
  }

};

// Build up the prototype
_.extend(Filtered.prototype, methods, Backbone.Events);

module.exports = Filtered;


},{"./src/create-filter.js":4,"backbone":false,"backbone-collection-proxy":3,"underscore":false}],"backbone-filtered-collection":[function(require,module,exports){
module.exports=require('cGCOHh');
},{}],3:[function(require,module,exports){

var _ = require('underscore');
var Backbone = require('backbone');

// Methods in the collection prototype that we won't expose
var blacklistedMethods = [
  "_onModelEvent", "_prepareModel", "_removeReference", "_reset", "add",
  "initialize", "sync", "remove", "reset", "set", "push", "pop", "unshift",
  "shift", "sort", "parse", "fetch", "create", "model", "off", "on",
  "listenTo", "listenToOnce", "bind", "trigger", "once", "stopListening"
];

var eventWhiteList = [
  'add', 'remove', 'reset', 'sort', 'destroy'
];

function proxyCollection(from, target) {

  function updateLength() {
    target.length = from.length;
  }

  function pipeEvents(eventName) {
    var args = _.toArray(arguments);
    var isChangeEvent = eventName === 'change' ||
                        eventName.slice(0, 7) === 'change:';

    // In the case of a `reset` event, the Collection.models reference
    // is updated to a new array, so we need to update our reference.
    if (eventName === 'reset') {
      target.models = from.models;
    }

    if (_.contains(eventWhiteList, eventName)) {
      if (_.contains(['add', 'remove', 'destory'], eventName)) {
        args[2] = target;
      } else if (_.contains(['reset', 'sort'], eventName)) {
        args[1] = target;
      }
      target.trigger.apply(this, args);
    } else if (isChangeEvent) {
      // In some cases I was seeing change events fired after the model
      // had already been removed from the collection.
      if (target.contains(args[1])) {
        target.trigger.apply(this, args);
      }
    }
  }

  var methods = {};

  _.each(_.functions(Backbone.Collection.prototype), function(method) {
    if (!_.contains(blacklistedMethods, method)) {
      methods[method] = function() {
        return from[method].apply(from, arguments);
      };
    }
  });

  _.extend(target, Backbone.Events, methods);

  target.listenTo(from, 'all', updateLength);
  target.listenTo(from, 'all', pipeEvents);
  target.models = from.models;

  updateLength();
  return target;
}

module.exports = proxyCollection;


},{"backbone":false,"underscore":false}],4:[function(require,module,exports){


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

function createFilterObject(filterFunction, keys) {
  // Make sure the keys value is either an array or null
  if (!_.isArray(keys)) {
    keys = null;
  }
  return { fn: filterFunction, keys: keys };
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

module.exports = createFilter;


},{}]},{},[])
;
return require('backbone-filtered-collection');

}));
