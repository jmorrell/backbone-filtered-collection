module.exports = function (grunt) {
  grunt.initConfig({

    browserify: {
      basic: {
        src: [],
        dest: './backbone-filtered-collection.js',
        options: {
          external: [ 'underscore', 'backbone' ],
          alias: ['./index.js:backbone-filtered-collection']
        }
      }
    },

    umd: {
      default: {
        src: './backbone-filtered-collection.js',
        template: './templates/umd.hbs',
        objectToExport: "require('backbone-filtered-collection')",
        globalAlias: 'FilteredCollection',
        deps: {
          'default': ['_', 'Backbone'],
          amd: ['underscore', 'backbone'],
          cjs: ['underscore', 'backbone'],
          global: ['_', 'Backbone']
        },
        browserifyMapping: '{"backbone":Backbone,"underscore":_}'
      }
    }

  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-umd');

  grunt.registerTask('default', ['browserify', 'umd']);
};
