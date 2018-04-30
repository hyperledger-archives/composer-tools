/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
