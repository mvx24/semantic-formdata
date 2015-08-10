var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

var scripts = ['bower_components/semantic-ui/src/definitions/behaviors/form.js', 'formdata.js'];
var files = {
	plugin: 'semantic.formdata.js',
	combined: 'formdata.js',
	pluginMin: 'semantic.formdata.min.js',
	combinedMin: 'formdata.min.js'
};
var destDir = 'dist';

gulp.task('lint', function() {
	var jshint = require('gulp-jshint');
	return gulp.src(scripts[1])
		.pipe(jshint())
		.pipe(jshint.reporter());
});

gulp.task('plugin', ['lint'], function() {
	return gulp.src(scripts[1])
		.pipe(rename(files.plugin))
		.pipe(gulp.dest(destDir))
		.pipe(uglify())
		.pipe(rename(files.pluginMin))
		.pipe(gulp.dest(destDir));
});

gulp.task('combined', function() {
	var concat = require('gulp-concat');
	return gulp.src(scripts)
		.pipe(concat(files.combined))
		.pipe(gulp.dest(destDir))
		.pipe(uglify())
		.pipe(rename(files.combinedMin))
		.pipe(gulp.dest(destDir));
});

gulp.task('build', ['plugin', 'combined']);

gulp.task('serve', ['build'], function() {
	var connect = require('gulp-connect');
	connect.server({root: ['dev', destDir, 'bower_components'], livereload: true});
	gulp.watch(scripts, ['build']);
	gulp.watch(destDir + '/**').on('change', function(event) { gulp.src(event.path).pipe(connect.reload()); });
});
gulp.task('default', ['serve']);
