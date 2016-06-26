var gulp = require("gulp");

// utils
var gutil = require("gulp-util");
var shell = require("gulp-shell");
var clean = require("gulp-clean");
var copy = require("gulp-copy");
var merge = require("merge2");
var pump = require("pump");
var runSequence = require("run-sequence");
var liveServer = require("live-server");

// compilers
var coffee = require("gulp-coffee");
var ts = require("gulp-typescript");
var less = require("gulp-less");
var sass = require("gulp-sass");
var scss = require("gulp-scss");

// uglifyers
var uglify = require("gulp-uglify");
var uglifycss = require("gulp-uglifycss");
var jsonminify = require("gulp-jsonminify");

// configurations
var liveServerConfig = require("./lsconfig.json");
var tsProject = ts.createProject("tsconfig.json");

gulp.task("clean:dist", function(){
    return gulp.src("www/dist")
            .pipe(clean({force: true}));
});

gulp.task("clean:jspm", function(){
    return gulp.src(["www/jspm_packages", "www/config.js"])
            .pipe(clean({force: true}));
});

gulp.task("jspm:install", shell.task("jspm install", {
    interactive: true
}));

gulp.task("copy", function(){
    gulp
        .src([
            "www/src/**/*",
            "!www/src/**/*.coffee",
            "!www/src/**/*.ts",
            "!www/src/**/*.less",
            "!www/src/**/*.sass",
            "!www/src/**/*.scss"
        ])
        .pipe(gulp.dest("www/dist"));
});

gulp.task("compile:coffee", function() {
    gulp.src('www/src/**/*.coffee')
      .pipe(coffee({bare: true}).on('error', gutil.log))
      .pipe(gulp.dest("www/dist"));
});

gulp.task("compile:ts", function(){
    var tsResult = gulp.src("www/src/**/*.ts")
        .pipe(ts(tsProject));

    return merge([
        tsResult.dts.pipe(gulp.dest("www/definitions")),
        tsResult.js.pipe(gulp.dest("www/dist"))
    ]);
});

gulp.task("compile:less", function () {
    return gulp.src("www/src/**/*.less")
        .pipe(less())
        .pipe(gulp.dest('www/dist'));
});

gulp.task("compile:sass", function () {
    return gulp.src("www/src/**/*.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(gulp.dest("www/dist"));
});

gulp.task("compile:scss", function () {
    gulp.src("www/src/**/*.scss")
        .pipe(scss({"bundleExec": true}))
        .pipe(gulp.dest("www/dist"));
});

gulp.task("watch:*", function(){
    gulp.watch([
        "www/src/**/*",
        "!www/src/**/*.coffee",
        "!www/src/**/*.ts",
        "!www/src/**/*.less",
        "!www/src/**/*.sass",
        "!www/src/**/*.scss"
    ], ["copy"]);
});

gulp.task("watch:coffee", function(){
    gulp.watch("www/src/**/*.coffee", ["compile:coffee"]);
});

gulp.task("watch:ts", function(){
    gulp.watch("www/src/**/*.ts", ["compile:ts"]);
});

gulp.task("watch:less", function(){
    gulp.watch("www/src/**/*.less", ["compile:less"]);
});

gulp.task("watch:sass", function(){
    gulp.watch("www/src/**/*.sass", ["compile:sass"]);
});

gulp.task("watch:scss", function(){
    gulp.watch("www/src/**/*.scss", ["compile:scss"]);
});

gulp.task("live-server", function(cb){
    liveServer.start(liveServerConfig);
});

gulp.task("uglify:js", function(cb){
    pump([
          gulp.src('www/dist/**/*.js'),
          uglify(),
          gulp.dest("www/dist")
      ],
      cb
    );
});

gulp.task("uglify:css", function(){
    gulp.src("www/dist/**/*.css")
        .pipe(uglifycss({
            "maxLineLen": 80,
            "uglyComments": true
        }))
        .pipe(gulp.dest("www/dist"));
});

gulp.task("uglify:json", function(){
    return gulp.src(['www/dist/**/*.json'])
        .pipe(jsonminify())
        .pipe(gulp.dest("www/dist"));
});

gulp.task("compile", function(cb){
    runSequence("compile:coffee", "compile:ts", "compile:less", "compile:sass", "compile:scss", cb);
});

gulp.task("watch", function(cb){
    runSequence(["watch:*", "watch:coffee", "watch:ts", "watch:less", "watch:sass", "watch:scss"], cb);
});

gulp.task("dev", function(cb){
    runSequence("copy", "compile", ["watch", "live-server"], cb);
});

gulp.task("uglify", function(cb){
    runSequence("uglify:js", "uglify:css", "uglify:json", cb);
});

gulp.task("build", function(cb){
    runSequence("jspm:install", "copy", "compile", "uglify", cb);
});

gulp.task("clean", function(cb){
    runSequence("clean:dist", "clean:jspm", cb);
});

gulp.task("default", function(cb){
    runSequence("clean", "build", cb);
});
