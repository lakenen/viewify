/*jshint node: true*/

var path = require('path');

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-filerev');
    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-inline-template');

    grunt.initConfig({
        copy: {
            html: {
                files: [{
                    expand: true,
                    flatten: true,
                    cwd: 'src/',
                    src: '*.html',
                    dest: '.tmp/html/'
                },{
                    expand: true,
                    flatten: true,
                    cwd: 'src/templates',
                    src: '*.html',
                    dest: '.tmp/html/'
                }]
            },
            images: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: '*',
                    cwd: 'src/images',
                    dest: 'public/images/'
                }]
            }
        },
        useminPrepare: {
            html: {
                src: ['src/index.html', 'src/templates/viewer.html'],
                options: {
                    root: './',
                    dest: 'public/'
                }
            }
        },
        usemin: {
            html: ['.tmp/html/*.html'],
            css: ['public/css/*.css'],
            options: {
                assetsDirs: ['public', 'src/images']
            }
        },
        filerev: {
            images: {
                src: 'src/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                dest: 'public/images/'
            }
        },
        htmlmin: {
            main: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    'public/viewer.html': '.tmp/html/viewer.html',
                    'public/index.html': '.tmp/html/index.html'
                }
            },
            viewify: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true,
                    minifyJS: true,
                    minifyCSS: true
                },
                files: {
                    '.tmp/html/viewify/overlay.html': 'src/templates/viewify/overlay.html',
                    '.tmp/html/viewify/status.html': 'src/templates/viewify/status.html'
                }
            }
        },
        cssmin: {
            viewify: {
                files: {
                    '.tmp/css/viewify/viewify.css': 'src/styles/viewify/viewify.css'
                }
            }
        },
        uglify: {
            viewify: {
                files: {
                    'public/1/v.js': '.tmp/js/viewify.js'
                }
            }
        },
        watch: {
            scripts: {
                files: ['src'],
                tasks: ['build']
            }
        },
        inlineTemplate: {
            viewify: {
                options: {
                    base: '.tmp/'
                },
                src: ['src/scripts/viewify/viewify.js'],
                dest: '.tmp/js/viewify.js'
            }
        },
        clean: {
            build: ['.tmp']
        },
        connect: {
            options: {
                keepalive: true,
                port: 8888
            },
            dev: {},
            prod: {
                options: {
                    base: 'public',
                    open: true
                }
            }
        }
    });
    grunt.registerTask('build', [
        'copy',
        'useminPrepare',
        'concat:generated',
        'uglify:generated',
        'cssmin:generated',
        'filerev',
        'usemin',
        'htmlmin',
        'viewify',
        'clean:build'
    ]);
    grunt.registerTask('viewify', [
        'htmlmin:viewify',
        'cssmin:viewify',
        'inlineTemplate',
        'uglify:viewify'
    ]);
    grunt.registerTask('serve', ['connect:dev']);
    grunt.registerTask('prod', ['build', 'connect:prod']);
    grunt.registerTask('default', ['build']);
};
