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

    grunt.initConfig({
        copy: {
            html: {
                files: [{
                    expand: true,
                    cwd: 'src/templates/',
                    src: '*',
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
            viewer: {
                src: 'src/templates/*.html',
                // css: 'src/styles/**/*.css',
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
                assetsDirs: ['public/images', 'src/images/*']
            }
        },
        // filerev: {
        //     images: {
        //         src: 'src/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
        //         dest: 'public/images/'
        //     }
        // },
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
            }
        },
        watch: {
            scripts: {
                files: ['src'],
                tasks: ['build'],
                options: {
                  spawn: false,
                }
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
                    base: 'public'
                }
            }
        }
    });
    grunt.registerTask('build', [
        'copy',
        'useminPrepare',
        'concat',
        'uglify',
        'cssmin',
        // 'filerev',
        'usemin',
        'htmlmin',
        // 'clean:build'
    ]);
    grunt.registerTask('serve', ['connect:dev']);
    grunt.registerTask('prod', ['build', 'connect:prod']);
    grunt.registerTask('default', ['build']);
};
