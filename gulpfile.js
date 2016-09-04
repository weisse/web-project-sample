var gulp = require("gulp");

// utils
var gutil = require("gulp-util");
var shell = require("gulp-shell");
var clean = require("gulp-clean");
var copy = require("gulp-copy");
var sourcemaps = require("gulp-sourcemaps");
var merge = require("merge2");
var pump = require("pump");
var runSequence = require("run-sequence");
var liveServer = require("live-server");

// compilers
var coffee = require("gulp-coffee");
var ts = require("gulp-typescript");
var react = require("gulp-react");
var elm = require("gulp-elm");
var less = require("gulp-less");
var sass = require("gulp-sass");
var scss = require("gulp-scss");

// uglifyers
var uglify = require("gulp-uglify");
var uglifycss = require("gulp-uglifycss");
var jsonminify = require("gulp-jsonminify");

// configurations
var liveServerConfig = require("./lsconfig.json");
var tsProject = ts.createProject("./tsconfig.json");

// constants
const DIST_PATH = "www/dist";
const MAPS_PATH = ".";
const NATIVE_PATHS = [
    "www/src/**/*",
    "!www/src/**/*.coffee",
    "!www/src/**/*.ts",
    "!www/src/**/*.jsx",
    "!www/src/**/*.elm",
    "!www/src/**/*.less",
    "!www/src/**/*.sass",
    "!www/src/**/*.scss"
];

gulp.task("clean:dist", function(){
    return gulp.src(DIST_PATH)
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
    return gulp
        .src(NATIVE_PATHS)
        .pipe(gulp.dest(DIST_PATH));
});

gulp.task("compile:coffee", function() {
    return gulp.src('www/src/**/*.coffee')
        .pipe(sourcemaps.init())
        .pipe(coffee({bare: true}).on('error', gutil.log))
        .pipe(sourcemaps.write(MAPS_PATH))
        .pipe(gulp.dest(DIST_PATH));
});

gulp.task("compile:ts", function(){
    var tsResult = gulp.src("www/src/**/*.ts")
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject));

    return merge([
        tsResult.dts
            .pipe(gulp.dest("www/definitions")),
        tsResult.js
            .pipe(sourcemaps.write(MAPS_PATH))
            .pipe(gulp.dest(DIST_PATH))
    ]);
});

gulp.task("compile:react", function(){
  	return gulp.src("www/src/**/*.jsx")
    		.pipe(sourcemaps.init())
    		.pipe(react())
    		.pipe(sourcemaps.write(MAPS_PATH))
    		.pipe(gulp.dest(DIST_PATH));
});

gulp.task("elm-init", elm.init);

gulp.task("compile:elm", ["elm-init"], function(){
    return gulp.src("www/src/**/*.elm")
        .pipe(elm())
        .pipe(gulp.dest(DIST_PATH));
});

gulp.task("compile:less", function () {
    return gulp.src("www/src/**/*.less")
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(sourcemaps.write(MAPS_PATH))
        .pipe(gulp.dest('www/dist'));
});

gulp.task("compile:sass", function () {
    return gulp.src("www/src/**/*.scss")
        .pipe(sourcemaps.init())
        .pipe(sass().on("error", sass.logError))
        .pipe(sourcemaps.write(MAPS_PATH))
        .pipe(gulp.dest(DIST_PATH));
});

gulp.task("compile:scss", function () {
    return gulp.src("www/src/**/*.scss")
        .pipe(sourcemaps.init())
        .pipe(scss({"bundleExec": true}))
        .pipe(sourcemaps.write(MAPS_PATH))
        .pipe(gulp.dest(DIST_PATH));
});

gulp.task("watch:*", function(){
    return gulp.watch(NATIVE_PATHS, ["copy"]);
});

gulp.task("watch:coffee", function(){
    return gulp.watch("www/src/**/*.coffee", ["compile:coffee"]);
});

gulp.task("watch:ts", function(){
    return gulp.watch("www/src/**/*.ts", ["compile:ts"]);
});

gulp.task("watch:react", function(){
    return gulp.watch("www/src/**/*.jsx", ["compile:react"]);
});

gulp.task("watch:elm", function(){
    return gulp.watch("www/src/**/*.elm", ["compile:elm"]);
});

gulp.task("watch:less", function(){
    return gulp.watch("www/src/**/*.less", ["compile:less"]);
});

gulp.task("watch:sass", function(){
    return gulp.watch("www/src/**/*.sass", ["compile:sass"]);
});

gulp.task("watch:scss", function(){
    return gulp.watch("www/src/**/*.scss", ["compile:scss"]);
});

gulp.task("live", function(cb){
    return liveServer.start(liveServerConfig);
});

gulp.task("uglify:js", function(){
    return gulp.src('www/dist/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest(DIST_PATH));
});

gulp.task("uglify:css", function(){
    return gulp.src("www/dist/**/*.css")
        .pipe(uglifycss({
            "maxLineLen": 80,
            "uglyComments": true
        }))
        .pipe(gulp.dest(DIST_PATH));
});

gulp.task("uglify:json", function(){
    return gulp.src(['www/dist/**/*.json'])
        .pipe(jsonminify())
        .pipe(gulp.dest(DIST_PATH));
});

gulp.task(
    "compile",
    ["compile:coffee", "compile:ts", "compile:react", "compile:elm",
    "compile:less", "compile:sass", "compile:scss"]
);

gulp.task(
    "watch",
    ["watch:*", "watch:coffee", "watch:ts", "watch:react",
    "watch:elm", "watch:less", "watch:sass", "watch:scss"]
);

gulp.task("uglify", ["uglify:js", "uglify:css", "uglify:json"]);

gulp.task("clean", function(cb){
    return runSequence("clean:dist", "clean:jspm", cb);
});

gulp.task("dev:dist", function(cb){
    return runSequence(
        "clean:dist", "copy", "compile", "watch", "live", cb
    );
});

gulp.task("dev", function(cb){
    return runSequence("clean:jspm", "jspm:install", "dev:dist", cb);
});

gulp.task("build:dist:dev", function(cb){
    return runSequence("copy", "compile", cb);
});

gulp.task("build:dist", function(cb){
    return runSequence("build:dist:dev", "uglify", cb);
});

gulp.task("build:dev", function(cb){
    return runSequence("jspm:install", "build:dist:dev", cb);
});

gulp.task("build", function(cb){
    return runSequence("jspm:install", "build:dist", cb);
});

gulp.task("rebuild:dist:dev", function(cb){
    return runSequence("clean:dist", "build:dist:dev", cb);
});

gulp.task("rebuild:dist", function(cb){
    return runSequence("clean:dist", "build:dist", cb);
});

gulp.task("rebuild:dev", function(cb){
    return runSequence("clean", "build:dev", cb);
});

gulp.task("rebuild", function(cb){
    return runSequence("clean", "build", cb);
});

gulp.task("default", function(cb){
    return runSequence("rebuild", cb);
});
