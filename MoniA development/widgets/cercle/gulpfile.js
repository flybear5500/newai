const gulp = require('gulp')
const terser = require('gulp-terser')
const rename = require('gulp-rename')
const { watch } = require('gulp')

function defaultTask() {
  return gulp
    .src('./js/downloadWidget.js')
    .pipe(
      terser({
        ecma: 6,
        keep_fnames: false,
        mangle: {
          toplevel: true,
        },
        output: {
          quote_style: 3,
        },
      }),
    )
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest('./js'))
}

function watchScript() {
  watch('./js/downloadWidget.js', defaultTask)
}

exports.default = defaultTask
exports.watch = watchScript
