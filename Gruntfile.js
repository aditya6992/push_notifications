var pkg = require('./package.json'),
    ts = formatDate(new Date());

module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        copy: {
            // Copy all source files to build directory except:
            // - tests
            // - node modules
            // - tmp files like logs
            // - previous build archives
            build: {
                files: [{
                    expand: true,
                    src: [
                        '**/*',
                        '!test/**',
                        '!node_modules/** ',
                        '!tmp/*',
                        '!dist.tar.gz'
                    ],
                    dest: 'dist/'
                }]
            },

            // Copy all non-dev-dependant node modules to build directory
            build_node_modules: {
                files: [{
                    expand: true,
                    src: [
                        'node_modules/**/*'
                    ],
                    dest: 'dist/',
                    filter: function (filepath) {
                        var result = false,
                            key;

                        for (key in pkg.dependencies) {
                            if (pkg.dependencies.hasOwnProperty(key)) {
                                if (key === filepath.split('/')[1]) {
                                    result = true;
                                    break;
                                }
                            }
                        }

                        return result;
                    }
                }]
            }
        },

        clean: {
            // Remove build output directory, if any
            build: ['dist/'],

            // Remove last build archive, if any
            remove_tar: ['dist.tar.gz']
        },

        jshint: {
            options: {
                jshintrc: true
            },
            all: ['**/*.js']
        },

        jscs: {
            // Run jscs on all files. Refer to .jscsrc
            all: ['**/*.js']
        },

        // ssh config will be used by sshexec and sftp
        sshconfig: {
            server: {
                host: '<%= grunt.option("server") %>',
                port: '<%= grunt.option("port") %>',
                username: '<%= grunt.option("username") %>',
                password: '<%= grunt.option("password") %>'
            }
        },

        exec: {
            // Execute shrinkwrap for the purpose of sanity check.
            // - It will report any missing modules
            // - It will report any extraneous modules
            // The generated shrinkwrap file itself is of no consequence since node modules
            // are packaged with the build
            shrinkwrap: {
                cmd: 'npm shrinkwrap'
            },

            // Archive build directory
            tar: {
                cmd: 'tar -zc dist/ | gzip > dist.tar.gz'
            }
        },

        sshexec: {
            options: {
                config: 'server'
            },

            // Create releases dir on server
            'make-base-dir': {
                command: 'mkdir -p /var/www/deployments/<%= pkg.name %>/releases'
            },

            // Create release directory on server
            'make-release-dir': {
                command: 'mkdir /var/www/deployments/<%= pkg.name %>/releases/<%= pkg.version %>_' + ts
            },

            // Extract release archive on server
            extract: {
                command: 'cd /var/www/deployments/<%= pkg.name %>/releases/<%= pkg.version %>_' + ts + ' && gzip -d dist.tar.gz && tar -xvf dist.tar --strip 1 && rm dist.tar'
            },

            // Extract release archive on server
            'rebuild-npm': {
                command: 'cd /var/www/deployments/<%= pkg.name %>/releases/<%= pkg.version %>_' + ts + ' && npm rebuild'
            },

            // Update 'current' as a symlink to the current release directory on the server
            'update-symlink': {
                command: 'rm -rf /var/www/deployments/<%= pkg.name %>/current && ln -s /var/www/deployments/<%= pkg.name %>/releases/<%= pkg.version %>_' + ts + ' /var/www/deployments/<%= pkg.name %>/current'
            },

            // Stop current running application version, if any
            'stop-forever': {
                command: 'forever stop <%= pkg.name %>; sleep 3;',
                options: {
                    ignoreErrors: true
                }
            },

            // Start new release
            'start-forever': {
                command: 'cd /var/www/deployments/<%= pkg.name %>/current; NODE_ENV=<%= grunt.option("env") %> forever start --uid=<%= pkg.name %> --append app.js;'
            }
        },

        sftp: {
            options: {
                config: 'server'
            },

            // Move release archive to release directory on server
            deploy: {
                files: {
                    './': 'dist.tar.gz'
                },
                options: {
                    path: '/var/www/deployments/<%= pkg.name %>/releases/<%= pkg.version %>_' + ts + '/'
                }
            }
        },

        mochaTest: {
            options: {
                reporter: 'dot',
                quiet: false,
                timeout: 5000
            },

            // Run mocha unit tests
            lib: ['tests/lib/**/*.js'],

            // Run mocha integration tests
            routes: ['tests/routes/**/*.js']
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-ssh');

    grunt.registerTask('build', [
        'jshint',
        'jscs',
        'mochaTest:lib',
        'mochaTest:routes',
        'exec:shrinkwrap',
        'clean:build',
        'copy:build',
        'copy:build_node_modules'
    ]);

    grunt.registerTask('deploy', [
        'build',
        'clean:remove_tar',
        'exec:tar',
        'sshexec:make-base-dir',
        'sshexec:make-release-dir',
        'sftp:deploy',
        'sshexec:extract',
        'sshexec:rebuild-npm',
        'sshexec:update-symlink',
        'sshexec:stop-forever',
        'sshexec:start-forever'
    ]);

    grunt.registerTask('default', ['build']);
};

function formatDate(d) {
    return d.getFullYear().toString() + getZeroBasedIndex(d.getMonth() + 1) +
        getZeroBasedIndex(d.getDate()) + getZeroBasedIndex(d.getHours()) +
        getZeroBasedIndex(d.getMinutes()) + getZeroBasedIndex(d.getSeconds());
}

function getZeroBasedIndex(number) {
    return number * 1 < 10 ? '0' + number : number;
}
