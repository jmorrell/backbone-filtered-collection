
var TableView = Backbone.View.extend({
  tagName: 'table',
  className: 'table',

  template: _.template($('#table').html()),
  rowTemplate: _.template($('#table-row').html()),
  emptyTemplate: _.template($('#empty-table').html()),

  initialize: function() {
    this.listenTo(this.collection, 'reset', this.render);
  },

  render: function() {
    this.$el.html(this.template());

    var tbody = [];
    this.collection.each(function(model) {
      tbody.push(this.rowTemplate(model.toJSON()));
    }, this);

    if (tbody.length) {
      this.$('tbody').html(tbody.join(''));
    } else {
      this.$('tbody').html(this.emptyTemplate());
    }
  }
});

var MapView = Marionette.ItemView.extend({

});

var dataCollection = new Backbone.Collection(data);
var filtered = new FilteredCollection(dataCollection);

var tableView = new TableView({
  collection: filtered,
  el: '.table'
});

var mapView = new MapView({
  collection: filtered,
  el: '.map'
});

tableView.render();
