var gulp = require('gulp');
const changed = require('gulp-changed');
const htmlmin = require('gulp-htmlmin');
const sass = require('gulp-sass');
const autofx = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const del = require('del');
const md5 = require('gulp-md5-assets');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const runSequence = require('run-sequence');
const proxyMiddleware = require('http-proxy-middleware');

const config = require('./gulpConfig');

// 清空文件
gulp.task('clean-dev', (cb) => {
    return del(['./dev/**/*'], cb);
})

gulp.task('clean-dist', (cb) => {
    return del(['./dist/**/*'], cb);
})

// 转移 html
gulp.task('move-html', () => {
    return gulp
        .src('./apps/**/*.html')
        .pipe(changed('./dev'))
        .pipe(gulp.dest('./dev'));
})

// 转移文件
gulp.task('move-file', () => {
    return gulp
        .src(['apps/**/js/*', 'apps/**/lib/**/*', 'apps/**/*.css'])
        .pipe(gulp.dest('dev'))
        .pipe(gulp.dest('dist'))
})

// 转移图片
gulp.task('move-img', () => {
    return gulp
        .src('./apps/**/*.{png,jpg,gif,ico,svg}')
        .pipe(changed('./dev'))
        .pipe(gulp.dest('./dev'))
        .pipe(reload({stream: true}));
})

// 转移图片（不压缩）
gulp.task('minify-img', ['move-img'], () => {
    return gulp
        .src('./dev/images/**/*.{png,jpg,gif,ico,svg}')
        .pipe(gulp.dest('./dist/images'))
        .pipe(md5(10, './dist/**/*.{css,js,html,json}'));
})

// 压缩 html
gulp.task('minify-html', ['move-html'], () => {
    return gulp
        .src('./dev/**/*.html')
        .pipe(htmlmin(config.htmlmin))
        .pipe(gulp.dest('./dist'))
        .pipe(md5(10));
})

// 编译 sass
gulp.task('sass', () => {
    return gulp
        .src('./apps/css/**/*.scss')
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(autofx(config.autofx))
        .pipe(gulp.dest('./dev/css'))
        .pipe(reload({stream: true}));
})

// 压缩 css
gulp.task('minify-css', ['sass'], () => {
    return gulp
        .src('./dev/css/**/*.css')
        .pipe(cleanCSS(config.cleanCSS))
        .pipe(gulp.dest('./dist/css'))
        .pipe(md5(10, './dist/**/*.html'));
})

// 编译 js
gulp.task('babel-js', () => {
    return gulp
        .src('./apps/**/*.js')
        .pipe(changed('./dev'))
        .pipe(babel({
            presets: ['es2015', 'stage-0'],
            plugins: ['transform-decorators-legacy']
        }))
        .pipe(gulp.dest('./dev'))
        .pipe(reload({stream: true}));
})

// 压缩js
gulp.task('minify-js', ['babel-js'], () => {
    return gulp
        .src('./dev/js/**/*.js')
        .pipe(uglify(config.uglify))
        .pipe(gulp.dest('./dist/js'))
        .pipe(md5(10, './dist/**/*.html'));
})

// 命令行命令
// 双清
gulp.task('clean', ['clean-dev','clean-dist']);

// 编译
gulp.task('dev', (cb) => {
    runSequence('clean-dev', 'move-file', 'move-html', [
        'sass', 'babel-js'
    ], 'move-img', cb)
})

// 压缩输出
gulp.task('dist', (cb) => {
    runSequence('clean-dist', 'move-file', 'minify-html', [
        'minify-css', 'minify-js'
    ], 'minify-img', cb)
})

// 测试执行
gulp.task('run', () => {
    // 代理配置, 实现环境切换
    let proxy = proxyMiddleware('/api', {
        target: 'https://106.14.39.56',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
    });
    browserSync.init({
        server: {
            baseDir: './dev',
            index:'index.html',
            middleware:[proxy]
        },
        open: 'external',
        injectChanges: true
    });
    gulp.watch('./apps/css/**/*.css', ['sass','move-file']).on('change', reload);
    gulp.watch('./apps/**/*.js', ['babel-js','move-file']).on('change', reload);
    gulp.watch('./apps/images/**/*.{png,jpg,gif,ico}', ['move-img']).on('change', reload);
    gulp.watch('./apps/**/*.html', ['move-html']).on('change', reload);
})