;(function() {
    var app = angular.module('myStars', ['classy', 'angular-loading-bar', 'ngSanitize']);

    // HTTP 请求拦截器, 对 response 数据做统一的错误处理.
    app.factory('responseInterceptor', ['$log', function($log) {
        var responseInterceptor = {
            response: function(res) {
                if (res.status === 200 && res.data.status === 0) {
                    return res;
                } else if (res.data.statusInfo){
                    alert(res.data.statusInfo);
                } else {
                    alert('错误代码: ' + res.status);
                }

                res.data = {
                    stauts: 1,
                    statusInfo: 'error',
                    data: []
                };

                return res;
            }
        };

        return responseInterceptor;
    }]);

    app.config(['$locationProvider', '$httpProvider', function($locationProvider, $httpProvider) {
        $locationProvider.html5Mode(true);

        $httpProvider.interceptors.push('responseInterceptor');
    }]);

    /**
     * servers
     */
    app.factory('AuthService', function($http) {
        return {
            getUser: function() {
                return $http.get('/api/auth/user');
            }
        };
    });

    app.factory('GitHubService', function($http) {
        return {
            getStars: function(page) {
                page = page || 1;

                return $http.get('/api/github/getStars', {
                    params: {
                        page: page,
                        per_page: 40
                    }
                });
            },
            getRepoReadme: function(owner, repo) {
                return $http.get("/api/github/repos/readme", {
                    params: {
                        owner: owner,
                        repo: repo
                    }
                });
            },
            renderMarkdown: function(text) {
                return $http.post('/api/github/renderMarkdown', {
                    text: text
                })
            }
        }
    });

    app.factory('RepoService', function($http) {
        return {
            getNotes: function(id) {
                return $http.get('/api/repo/getNotes', {
                    params: {
                        id: id
                    }
                });
            },
            updateNotes: function(id, notes) {
                return $http.post('/api/repo/updateNotes', {
                    id: id,
                    notes: notes
                });
            },
            getTags: function() {
                return $http.get('/api/repo/getTags');
            },
            updateTags: function(id, tags) {
                return $http.post('api/repo/updateTags', {
                    id: id,
                    tags: tags
                });
            }
        }
    });

    app.factory('DataCacheService', function() {
        var data = [];

        return {
            data: function(id, attr, value) {
                var i = data.length;
                var repo;

                if (id === undefined || parseInt(id) < 0) return;

                while (i--) {
                    if (parseInt(data[i].id) === parseInt(id)) {
                        repo = data[i];
                        break;
                    }
                }

                if (repo === undefined) {
                    repo = {id: id};
                    data.push(repo);
                }

                if (arguments.length === 2) {
                    return repo[attr];
                }

                repo[attr] = value;
                return repo;
            }
        }
    });

    /**
     * directive
     */
    app.directive('copy', function() {
        return {
            restrict: 'A',
            link: function($scope, $elem, attr) {
                $elem.on('copy', function(event) {
                    event.clipboardData.clearData();
                    event.clipboardData.setData('text/plain', $scope.repo.clone_url);
                    event.preventDefault();
                }).on('aftercopy', function() {
                    var that = this;

                    $(this).children().removeClass('glyphicon-copy').addClass('glyphicon-ok text-success');

                    setTimeout(function() {
                        $(that).children().removeClass('glyphicon-ok text-success').addClass('glyphicon-copy');
                    }, 1000);
                });
            }
        };
    });

    /**
     * @description: 标签过滤器
     * @return: 返回包含指定标签的 repos
     */
    app.filter('tags', function() {
        return function(allStars, filterTag) {
            var result = [];

            if (!filterTag) {
                return allStars;
            }

            if (filterTag === 'all') {
                return allStars;
            } else if (filterTag === 'untagged') {
                angular.forEach(allStars, function(item) {
                    if (!item.tags || !item.tags.length) {
                        result.push(item);
                    }
                });
            } else {
                angular.forEach(allStars, function(item) {
                    if (item.tags && item.tags.indexOf(filterTag) !== -1) {
                        result.push(item);
                    }
                });
            }

            return result;
        }
    });

    /**
     * controller
     */
    app.classy.controller({
        name: 'DashboardController',
        inject: ['$rootScope', '$sce', '$scope', 'AuthService', 'GitHubService', 'RepoService', 'DataCacheService'],
        init: function() {
            var that = this;

            this.$.filterTag = 'all';
            this.$.allStars = [];
            this.$.page = 1;

            this.AuthService.getUser().then(function(res) {
                that.$rootScope.user = res.data;
            });

            this._getStars();
            this._getTags();
        },
        watch: {
            currentStar: '_getRepo',
            filterTag: '_resetCurrentStar'
        },
        methods: {
            _getStars: function() {
                var that = this;

                this.GitHubService.getStars(this.$.page).then(function(res) {
                    that.$.allStars.push.apply(that.$.allStars, res.data.data);

                    if (that.$.extendTagsStatus === false) {
                        that._extendTags(that.$.tagsData);
                    }
                });
            },
            _getTags: function() {
                var that = this;
                this.RepoService.getTags().then(function(res) {
                    that._extendTags(res.data.data);
                    that._uniqueTagList(res.data.data);
                });
            },
            _extendTags: function(tags) {
                var allStars = this.$.allStars || [];

                if (!allStars.length) {
                    this.$.extendTagsStatus = false;
                    this.$.tagsData = tags;
                    return;
                }

                this.$.extendTagsStatus = true;

                for (var i = 0, len = allStars.length; i < len; i++) {
                    for (var j = 0,length = tags.length; j < length; j++) {
                        if (parseInt(allStars[i].id) === parseInt(tags[j].id)) {
                            allStars[i].tags = tags[j].tags;
                            break;
                        }
                        allStars[i].tags = [];
                    }
                }

                this.$.extendTagsStatus = false;
            },
            _uniqueTagList: function(data) {
                var obj = {};

                angular.forEach(data, function(item) {
                    angular.forEach(item.tags, function(tag) {
                        if (obj[tag]) {
                            return true;
                        }
                        obj[tag] = true;
                    });
                });

                this.$.tagsList = Object.keys(obj);
            },
            _cloneArray: function(arr) {
                return arr&&arr.length ? arr.join(',').split(',') : [];
            },
            _getRepo: function() {
                var currentStar = this.$.currentStar;
                var id = currentStar ? currentStar.id : -1;
                var cacheReadmeData = this.DataCacheService.data(id, 'readme');
                var cacheNotesData = this.DataCacheService.data(id, 'notes');

                var that = this;

                if (!currentStar) return;

                this.$.repo = {
                    id: id,
                    tags: that._cloneArray(currentStar.tags),
                    clone_url: currentStar.clone_url
                };

                if (cacheReadmeData !== undefined) {
                    this.$.repo.readme = cacheReadmeData;
                } else {

                    this.$.loadingRepoReadme = true;

                    this.GitHubService.getRepoReadme(currentStar.owner.login, currentStar.name).then(function(res) {
                        that._atobReadMe(res.data.data);
                    });
                }

                if (cacheNotesData !== undefined) {
                    this.$.repo.notes = cacheNotesData;
                } else {
                    this.RepoService.getNotes(id).then(function(res) {
                        that.$.repo.notes = res.data.data;
                        that.DataCacheService.data(id, 'notes', res.data.data);
                    });
                }
            },
            _atobReadMe: function(data) {
                var decodeData = decodeURIComponent(escape(window.atob(data.content)));
                var that = this;

                if (!data.encoding === 'base64') {
                    return alert('Error: 格式错误.')
                }

                this.GitHubService.renderMarkdown(decodeData).then(function(res) {
                    that.$.repo.readme = res.data.data;

                    that.DataCacheService.data(that.$.repo.id, 'readme', res.data.data);

                    that.$.loadingRepoReadme = false;
                });
            },
            _resetCurrentStar: function() {
                this.$.currentStar = null;
                this.$.repo= null;
            },
            setCurrentStar: function(star) {
                if (this.$.loadingRepoReadme) {
                    return;
                }

                this.$.currentStar= star;
            },
            setCurrentTag: function() {
                if (typeof arguments[0]!== 'string') {
                    var $target = angular.element(arguments[0].target);
                    this.$.filterTag = $target.text().trim();
                } else {
                    this.$.filterTag = arguments[0];
                }
            },
            addTags: function(tag) {
                if (!tag) return;

                if (this.$.repo.tags.indexOf(tag) !== -1) {
                    return;
                }

                this.$.repo.tags.push(tag);
                this.$.newTags = '';
            },
            removeTag: function(tag) {
                var tags = this.$.repo.tags;

                var index = tags.indexOf(tag);

                this.$.repo.tags.splice(index, 1);
            },
            updateNotes: function(notes) {
                var id = this.$.repo.id;
                var that = this;

                this.RepoService.updateNotes(id, notes).then(function(res) {
                    that.$.repo.notes = notes;
                    that.DataCacheService.data(id, 'notes', notes);
                    that._hideModal('#modal-edit-box');
                });
            },
            updateTags: function() {
                var id  = this.$.currentStar.id;
                var tags = this.$.repo.tags;
                var that = this;

                this.RepoService.updateTags(id, tags).then(function(res) {
                    that._hideModal('#modal-tags-box');
                    that.$.currentStar.tags = that._cloneArray(tags);
                    that.updateTagsList(tags);
                });
            },
            updateTagsList: function(tags) {
                var i = tags.length;

                while(i--) {
                    if (this.$.tagsList.indexOf(tags[i]) === -1) {
                        this.$.tagsList.push(tags[i]);
                    }
                }
            },
            getNextStars: function() {
                this.$.page ++;

                this._getStars();
            },
            _hideModal: function(sizzle) {
                $(sizzle).modal('hide');
            }
        }
    });

    app.classy.controller({
        name: 'HomeController',
        inject: ['$scope', '$location'],
        init: function() {
            var routeQuery = this.$location.search();

            this.$.autoSignIn = routeQuery.autoSignIn;

            if (this.$.autoSignIn) {
                this.login();
            }
        },
        methods: {
            login: function() {
                window.location = '/auth/login';
            }
        }
    });
})();
