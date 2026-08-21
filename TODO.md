1. 该项目目前对于字体大小方面的处理很分散，有的是全局class（font-big/small）、有的是tailwind（text-xs）、有的是内部运算（calc）。除此之外，src\App.vue虽然实现了用户设置（naiveUIThemeOverrides），但只针对naive_ui的配置，很多其他地方没有照顾到。现在希望统一使用tailwind来控制，请规划实现方案。
