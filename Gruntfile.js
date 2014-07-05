'use strict';

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);
  var projectConfig = require('./config').current;

  grunt.initConfig({
    app: {
      gruntfile: 'Gruntfile.js',
      js: {
        src: ['src/*/{routes,controllers,schemas}.js', 'src/api/server.js']
      },
      test: {
        src: ['src/*/tests.js'] // Also defined in .travis.yml
      }
    },

    watch: {
      gruntfile: {
        files: ['<%= app.gruntfile %>']
      },
      js: {
        files: ['<%= app.js.src %>'],
        tasks: ['newer:jshint:all'],
        options: {
          livereload: true
        }
      }
    },

    nodemon: {
      dev: {
        script: 'index.js',
        options: {
          nodeArgs: ['--debug'],
          env: {
            PORT: projectConfig.http.port
          }
        }
      }
    },

    mochaTest: {
      test: {
        src: ['<%= app.test.src %>'],
        options: {
          reporter: 'spec',
          run: true
        }
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      files: {
        src: ['<%= app.gruntfile %>', '<%= app.js.src %>', '<%= app.test.src %>']
      }
    },
  });

  grunt.registerTask('test', function () {
    grunt.task.run([
      'mochaTest'
    ]);
  });

  grunt.registerTask('serve', function () {
    grunt.task.run([
      'nodemon',
      'watch'
    ]);
  });

  grunt.registerTask('travis', [
    'newer:jshint',
    'test'
  ]);

  grunt.registerTask('default', [
    'newer:jshint',
    'test',
    'serve'
  ]);
};
