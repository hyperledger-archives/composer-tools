const gulp = require('gulp');
const zip = require('gulp-zip');
const tar = require('gulp-tar');
const gzip = require('gulp-gzip');

gulp.task('default',['zip','tgz']);

gulp.task('zip', () =>
    gulp.src(['../package.json','../*.sh','../fabric-scripts/**/*'  ], { base : '..'})
        .pipe(zip('fabric-dev-servers.zip'))
        .pipe(gulp.dest('..'))
);

gulp.task('tgz', () =>
    gulp.src(['../package.json','../*.sh','../fabric-scripts/**/*'  ], { base : '..'})
    	.pipe(tar('fabric-dev-servers.tar'))
        .pipe(gzip())
        .pipe(gulp.dest('..'))
);
