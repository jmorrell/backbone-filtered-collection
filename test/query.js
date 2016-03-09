describe('queried collection', function() {

  var mockData = [
    {
      id: 1,
      firstname: 'Jane',
      lastname: 'Smith',
      age: 35,
      email: 'janesmith@example.com'
    }, {
      id: 2,
      firstname: 'John',
      lastname: 'Doe',
      age: 52,
      email: 'johndoe@example.com'
    }, {
      id: 3,
      firstname: 'Joe',
      lastname: 'Bloggs',
      age: 28,
      email: 'joebloggs@example.com'
    }
  ];

  var filtered, superset;

  beforeEach(function () {
    var Model = Backbone.Model.extend({
      fields: ['firstname', 'lastname']
    });
    var Collection = Backbone.Collection.extend({
      model: Model
    });
    superset = new Collection(mockData);
    filtered = new FilteredCollection(superset);
  });

  it('should filter results on simple string query', function () {
    expect(filtered).to.have.length(3);

    // add firstname query
    filtered.filterBy('jane');
    expect(filtered).to.have.length(1);

    // add lastname query
    filtered.filterBy('bloggs');
    expect(filtered).to.have.length(1);

    // add partial query
    filtered.filterBy('jo');
    expect(filtered).to.have.length(2);
  });

  it('should filter results on parsed simple string query', function () {
    expect(filtered).to.have.length(3);

    // add firstname query
    filtered.filterBy([{
      type: 'string',
      query: 'jane'
    }]);
    expect(filtered).to.have.length(1);

    // add lastname query
    filtered.filterBy([{
      type: 'string',
      query: 'bloggs'
    }]);
    expect(filtered).to.have.length(1);

    // add partial query
    filtered.filterBy([{
      type: 'string',
      query: 'jo'
    }]);
    expect(filtered).to.have.length(2);
  });

  it('should filter results on complex `query`', function () {
    expect(filtered).to.have.length(3);

    // add prefix query
    filtered.filterBy('id:1');
    expect(filtered).to.have.length(1);

    // add prefix query
    filtered.filterBy('age:52');
    expect(filtered).to.have.length(1);

    // add prefix range query - FAIL
    //filtered.filterBy('age:20-40');
    //expect(filtered).to.have.length(2);
  });

});