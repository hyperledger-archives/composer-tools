const gulp = require('gulp');
const zip = require('gulp-zip');

gulp.task('default', () =>
    gulp.src(['../*.sh','../fabric-scripts/**/*'  ], { base : '..'})
        .pipe(zip('fabric-dev-servers.zip'))
        .pipe(gulp.dest('..'))
);
