var assert = chai.assert;

var mockData = [
  { a: 1, b: 2, c:'a' },
  { a: 1, b: 3, c:'b' },
  { a: 1, b: 3, c:'c' },
  { a: 2, b: 2, c:'20' },
  { a: 2, b: 2, c:'3' }
];


describe('unfiltered collection', function() {
  var filtered, collection;

  beforeEach(function() {
    collection = new Backbone.Collection(mockData);
    filtered = new FilteredCollection(collection);
  });

  it('has the same length as the original collection', function() {
    assert.equal(collection.length, filtered.length);
  });

  it('results in the same toJSON output', function() {
    assert.equal(collection.toJSON(), filtered.toJSON());
  });

  it('has the same .first() output', function() {
    assert.equal(collection.first(), filtered.first());
  });

  it('has the same .last() output', function() {
    assert.equal(collection.last(), filtered.last());
  });

  it('has the same .at() output', function() {
    assert.equal(collection.at(1), filtered.at(1));
    assert.equal(collection.at(2), filtered.at(2));
    assert.equal(collection.at(3), filtered.at(3));
    assert.equal(collection.at(4), filtered.at(4));
  });

});

describe('collection filtered with objects, static values', function() {
  var filtered, collection;

  beforeEach(function() {
    collection = new Backbone.Collection(mockData);
    filtered = new FilteredCollection(collection);
  });

  it('should filter results on `filterBy`', function() {
    assert(filtered.length === 5);

    // add a filter on the 'a' key
    filtered.filterBy('a = 1', { a: 1 });
    assert(filtered.length === 3);

    // add a second filter on the 'b' key
    filtered.filterBy('b = 2', { b: 2 });
    assert(filtered.length === 1);
  });

  it('should delete filters on `removeFilter`', function() {
    // add two filters
    filtered.filterBy('a = 1', { a: 1 });
    filtered.filterBy('b = 2', { b: 2 });
    assert(filtered.length === 1);

    // You can eliminate a filter by name
    filtered.removeFilter('a = 1');
    assert(filtered.length === 3);
  });

  it('should remove all filters on `resetFilters`', function() {
    // add two filters
    filtered.filterBy('a = 1', { a: 1 });
    filtered.filterBy('b = 2', { b: 2 });
    assert(filtered.length === 1);

    filtered.resetFilters();
    assert(filtered.length === 5);
  });

  it('`filterBy` should be chainable', function() {
    filtered
      .filterBy('a = 1', { a: 1 })
      .filterBy('b = 2', { b: 2 });

    assert(filtered.length === 1);
  });

  it('`removeFilter` should be chainable', function() {
    filtered
      .filterBy('a = 1', { a: 1 })
      .filterBy('b = 2', { b: 2 })
      .removeFilter('a = 1')
      .removeFilter('b = 2');

    assert(filtered.length === 5);
  });

  it('`resetFilters` should be chainable', function() {
    filtered
      .filterBy('a = 1', { a: 1 })
      .filterBy('b = 2', { b: 2 })
      .resetFilters();

    assert(filtered.length === 5);

    filtered
      .filterBy('a = 1', { a: 1 })
      .filterBy('b = 2', { b: 2 })
      .resetFilters()
      .filterBy('a = 1', { a: 1 });

    assert(filtered.length === 3);
  });

  it('filters with the same name should replace each other', function() {
    filtered.filterBy('a filter', { a: 1 });
    assert(filtered.length === 3);
      
    filtered.filterBy('a filter', { a: 3 });
    assert(filtered.length === 0);
  });

  it('filtered collection should contain the original backbone models', function() {
    filtered.filterBy('a = 1', { a: 1 });

    var first = collection.first();
    var filteredFirst = filtered.first();

    // The original model should be the model found in the
    // filtered collection.
    assert(first === filteredFirst);
    assert(_.isEqual(first.toJSON(), filteredFirst.toJSON()));

    // Triggering an event on one model should be fire events
    // on the other since they are just references to the same
    // object.
    var called = false;
    var spy = function() {
      called = true;
    };
    filteredFirst.on('test', spy);
    first.trigger('test');
    assert(called);
  });

});

describe('collection filtered with objects, function values', function() {
  var filtered, collection;

  beforeEach(function() {
    collection = new Backbone.Collection(mockData);
    filtered = new FilteredCollection(collection);
  });

  it('should filter results on `filterBy`', function() {
    assert(filtered.length === 5);

    // add a filter on the 'a' key
    filtered.filterBy('a = 1', { a: function(val) { return val === 1; } });
    assert(filtered.length === 3);

    // add a second filter on the 'b' key
    filtered.filterBy('b = 2', { b: function(val) { return val === 2; } });
    assert(filtered.length === 1);
  });

  it('should delete filters on `removeFilter`', function() {
    // add two filters
    filtered.filterBy('a = 1', { a: function(val) { return val === 1; } });
    filtered.filterBy('b = 2', { b: function(val) { return val === 2; } });
    assert(filtered.length === 1);

    // You can eliminate a filter by name
    filtered.removeFilter('a = 1');
    assert(filtered.length === 3);
  });

  it('should remove all filters on `resetFilters`', function() {
    // add two filters
    filtered.filterBy('a = 1', { a: function(val) { return val === 1; } });
    filtered.filterBy('b = 2', { b: function(val) { return val === 2; } });
    assert(filtered.length === 1);

    filtered.resetFilters();
    assert(filtered.length === 5);
  });

  it('`filterBy` should be chainable', function() {
    filtered
      .filterBy('a = 1', { a: function(val) { return val === 1; } })
      .filterBy('b = 2', { b: function(val) { return val === 2; } });

    assert(filtered.length === 1);
  });

  it('`removeFilter` should be chainable', function() {
    filtered
      .filterBy('a = 1', { a: function(val) { return val === 1; } })
      .filterBy('b = 2', { b: function(val) { return val === 2; } })
      .removeFilter('a = 1')
      .removeFilter('b = 2');

    assert(filtered.length === 5);
  });

  it('`resetFilters` should be chainable', function() {
    filtered
      .filterBy('a = 1', { a: function(val) { return val === 1; } })
      .filterBy('b = 2', { b: function(val) { return val === 2; } })
      .resetFilters();

    assert(filtered.length === 5);

    filtered
      .filterBy('a = 1', { a: function(val) { return val === 1; } })
      .filterBy('b = 2', { b: function(val) { return val === 2; } })
      .resetFilters()
      .filterBy('a = 1', { a: function(val) { return val === 1; } });

    assert(filtered.length === 3);
  });

  it('filters with the same name should replace each other', function() {
    filtered.filterBy('a filter', { a: function(val) { return val === 1; } });
    assert(filtered.length === 3);
      
    filtered.filterBy('a filter', { a: function(val) { return val === 3; } });
    assert(filtered.length === 0);
  });

  it('filtered collection should contain the original backbone models', function() {
    filtered.filterBy('a = 1', { a: function(val) { return val === 1; } });

    var first = collection.first();
    var filteredFirst = filtered.first();

    // The original model should be the model found in the
    // filtered collection.
    assert(first === filteredFirst);
    assert(_.isEqual(first.toJSON(), filteredFirst.toJSON()));

    // Triggering an event on one model should be fire events
    // on the other since they are just references to the same
    // object.
    var called = false;
    var spy = function() {
      called = true;
    };
    filteredFirst.on('test', spy);
    first.trigger('test');
    assert(called);
  });

});


describe('collection filtered with functions', function() {
  var filtered, collection;

  beforeEach(function() {
    collection = new Backbone.Collection(mockData);
    filtered = new FilteredCollection(collection);
  });

  it('should filter results on `filterBy`', function() {
    assert(filtered.length === 5);

    // add a filter on the 'a' key
    filtered.filterBy('a = 1', function(model) {
      return model.get('a') === 1;
    });
    assert(filtered.length === 3);

    // add a second filter on the 'b' key
    filtered.filterBy('b = 2', function(model) {
      return model.get('b') === 2;
    });
    assert(filtered.length === 1);
  });

  it('should delete filters on `removeFilter`', function() {
    // add two filters
    filtered.filterBy('a = 1', function(model) {
      return model.get('a') === 1;
    });
    filtered.filterBy('b = 2', function(model) {
      return model.get('b') === 2;
    });
    assert(filtered.length === 1);

    // You can eliminate a filter by name
    filtered.removeFilter('a = 1');
    assert(filtered.length === 3);
  });

  it('should remove all filters on `resetFilters`', function() {
    // add two filters
    filtered.filterBy('a = 1', function(model) {
      return model.get('a') === 1;
    });
    filtered.filterBy('b = 2', function(model) {
      return model.get('b') === 2;
    });
    assert(filtered.length === 1);

    filtered.resetFilters();
    assert(filtered.length === 5);
  });

  it('`filterBy` should be chainable', function() {
    filtered
      .filterBy('a = 1', function(model) {
      return model.get('a') === 1;
    })
      .filterBy('b = 2', function(model) {
      return model.get('b') === 2;
    });

    assert(filtered.length === 1);
  });

  it('`removeFilter` should be chainable', function() {
    filtered
      .filterBy('a = 1', function(model) {
        return model.get('a') === 1;
      })
      .filterBy('b = 2', function(model) {
        return model.get('b') === 2;
      })
      .removeFilter('a = 1')
      .removeFilter('b = 2');

    assert(filtered.length === 5);
  });

  it('`resetFilters` should be chainable', function() {
    filtered
      .filterBy('a = 1', function(model) {
        return model.get('a') === 1;
      })
      .filterBy('b = 2', function(model) {
        return model.get('b') === 2;
      })
      .resetFilters();

    assert(filtered.length === 5);

    filtered
      .filterBy('a = 1', function(model) {
        return model.get('a') === 1;
      })
      .filterBy('b = 2', function(model) {
        return model.get('b') === 2;
      })
      .resetFilters()
      .filterBy('a = 1', function(model) {
        return model.get('a') === 1;
      });

    assert(filtered.length === 3);
  });

  it('filters with the same name should replace each other', function() {
    filtered.filterBy('a filter', function(model) {
      return model.get('a') === 1;
    });
    assert(filtered.length === 3);
      
    filtered.filterBy('a filter', function(model) {
      return model.get('a') === 3;
    });
    assert(filtered.length === 0);
  });

  it('filtered collection should contain the original backbone models', function() {
    filtered.filterBy('a = 1', function(model) {
      return model.get('a') === 1;
    });

    var first = collection.first();
    var filteredFirst = filtered.first();

    // The original model should be the model found in the
    // filtered collection.
    assert(first === filteredFirst);
    assert(_.isEqual(first.toJSON(), filteredFirst.toJSON()));

    // Triggering an event on one model should be fire events
    // on the other since they are just references to the same
    // object.
    var called = [];
    var spy = function() {
      called.push(true);
    };
    filteredFirst.on('test', spy);
    first.trigger('test');
    assert(called.length === 1);
  });
});

describe('changing a model in the superset', function() {
  var filtered, superset;

  beforeEach(function() {
    superset = new Backbone.Collection(mockData);
    filtered = new FilteredCollection(collection);
  });

  it('a model changes to fit the filter function', function() {
    // Add a filter on the 'a' key
    // This leaves 3 models
    filtered.filterBy('a = 1', { a: 1 });

    // The last model in the set should have a = 2
    // and not be present in the filtered collection
    var lastModel = superset.last();
    assert(lastModel.get('a') === 2);
    assert(filtered.contains(lastModel) === false);

    // However if we change the 'a' parameter to 1,
    // it should show up in the filtered collection
    lastModel.set({ a: 1 });
    assert(filtered.length === 4);
    assert(filtered.contains(lastModel));
  });

  it('a model changes to not fit the filter function', function() {
    // Add a filter on the 'a' key
    // This leaves 3 models
    filtered.filterBy('a = 1', { a: 1 });

    // The first model in the set should have a = 1
    // and be present in the filtered collection
    var firstModel = superset.first();
    assert(firstModel.get('a') === 1);
    assert(filtered.contains(firstModel));

    // However if we change the 'a' parameter to 2,
    // it should disappear from the filtered collection
    firstModel.set({ a: 2 });
    assert(filtered.length === 3);
    assert(filtered.contains(firstModel) === false);
  });

});

describe('forcing a refilter', function() {

  it('the whole collection', function() {

  });

  it('a particular model', function() {

  });

});

// adding a model?
// deleting a model?
// events

// Add optional filter key dependencies when using a function? This could be used
// to make things more efficient
// filtered.filterBy(filterFn, 'key', 'key2');
// filtered.filterBy(filterFn, [ 'key', 'key2' ]);

// Likely need to have a way to force a refilter
// filtered.refilter();

// A way to trigger re-filtering a particular model?
// filtered.add(model);
// model.set({ foo: 'bar' }, { silent: true });
// model.trigger('refilter');

// return the superset
// filtered.superset()

// Collection subset that we should implement

// get
// at
// toJSON
// length
// map
// each
// forEach

// slice
// where
// findWhere













