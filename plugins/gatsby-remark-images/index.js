"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _require = require("./constants"),
  imageClass = _require.imageClass,
  imageBackgroundClass = _require.imageBackgroundClass,
  imageWrapperClass = _require.imageWrapperClass;

var visitWithParents = require("unist-util-visit-parents");

var path = require("path");

var isRelativeUrl = require("is-relative-url");

var _ = require("lodash");

var _require2 = require("gatsby-plugin-sharp"),
  fluid = _require2.fluid;

var Promise = require("bluebird");

var cheerio = require("cheerio");

var slash = require("slash"); // If the image is relative (not hosted elsewhere)
// 1. Find the image file
// 2. Find the image's size
// 3. Filter out any responsive image fluid sizes that are greater than the image's width
// 4. Create the responsive images.
// 5. Set the html w/ aspect ratio helper.


module.exports = function (_ref, pluginOptions) {
  var files = _ref.files,
    markdownNode = _ref.markdownNode,
    markdownAST = _ref.markdownAST,
    pathPrefix = _ref.pathPrefix,
    getNode = _ref.getNode,
    reporter = _ref.reporter,
    cache = _ref.cache;
  var defaults = {
    maxWidth: 650,
    wrapperStyle: "",
    backgroundColor: "white",
    linkImagesToOriginal: true,
    showCaptions: false,
    pathPrefix: pathPrefix,
    withWebp: false
  };

  var options = _.defaults(pluginOptions, defaults);

  var findParentLinks = function findParentLinks(_ref2) {
    var children = _ref2.children;
    return children.some(function (node) {
      return node.type === "html" && !!node.value.match(/<a /) || node.type === "link";
    });
  }; // This will allow the use of html image tags
  // const rawHtmlNodes = select(markdownAST, `html`)


  var rawHtmlNodes = [];
  visitWithParents(markdownAST, "html", function (node, ancestors) {
    var inLink = ancestors.some(findParentLinks);
    rawHtmlNodes.push({
      node: node,
      inLink: inLink
    });
  }); // This will only work for markdown syntax image tags

  var markdownImageNodes = [];
  visitWithParents(markdownAST, "image", function (node, ancestors) {
    var inLink = ancestors.some(findParentLinks);
    markdownImageNodes.push({
      node: node,
      inLink: inLink
    });
  }); // Takes a node and generates the needed images and then returns
  // the needed HTML replacement for the image

  var generateImagesAndUpdateNode =
    /*#__PURE__*/
    function () {
      var _ref3 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/
        _regenerator.default.mark(function _callee(node, resolve, inLink) {
          var parentNode, imagePath, imageNode, fluidResult, originalImg, fallbackSrc, srcSet, presentationWidth, srcSplit, fileName, fileNameNoExt, defaultAlt, imageStyle, imageTag, webpFluidResult, ratio, showCaptions, rawHTML;
          return _regenerator.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  // Check if this markdownNode has a File parent. This plugin
                  // won't work if the image isn't hosted locally.
                  parentNode = getNode(markdownNode.parent);

                  if (!(parentNode && parentNode.dir)) {
                    _context.next = 5;
                    break;
                  }

                  imagePath = slash(path.join(parentNode.dir, node.url));
                  _context.next = 6;
                  break;

                case 5:
                  return _context.abrupt("return", null);

                case 6:
                  imageNode = _.find(files, function (file) {
                    if (file && file.absolutePath) {
                      return file.absolutePath === imagePath;
                    }

                    return null;
                  });

                  if (!(!imageNode || !imageNode.absolutePath)) {
                    _context.next = 9;
                    break;
                  }

                  return _context.abrupt("return", resolve());

                case 9:
                  _context.next = 11;
                  return fluid({
                    file: imageNode,
                    args: options,
                    reporter: reporter,
                    cache: cache
                  });

                case 11:
                  fluidResult = _context.sent;

                  if (fluidResult) {
                    _context.next = 14;
                    break;
                  }

                  return _context.abrupt("return", resolve());

                case 14:
                  originalImg = fluidResult.originalImg;
                  fallbackSrc = fluidResult.src;
                  srcSet = fluidResult.srcSet;
                  presentationWidth = fluidResult.presentationWidth; // Generate default alt tag

                  srcSplit = node.url.split("/");
                  fileName = srcSplit[srcSplit.length - 1];
                  fileNameNoExt = fileName.replace(/\.[^/.]+$/, "");
                  defaultAlt = fileNameNoExt.replace(/[^A-Z0-9]/gi, " ");
                  imageStyle = ("\n      width: 100%;\n      height: 100%;\n      margin: 0;\n      vertical-align: middle;\n      position: absolute;\n      top: 0;\n      left: 0;\n      box-shadow: 0px 0px 40px 20px rgba(0, 0, 0, 0.05); " + options.backgroundColor + ";").replace(/\s*(\S+:)\s*/g, "$1"); // Create our base image tag

                  imageTag = ("\n      <img\n        class=\"" + imageClass + "\"\n        style=\"" + imageStyle + "\"\n        alt=\"" + (node.alt ? node.alt : defaultAlt) + "\"\n        title=\"" + (node.title ? node.title : "") + "\"\n        src=\"" + fallbackSrc + "\"\n        srcset=\"" + srcSet + "\"\n        sizes=\"" + fluidResult.sizes + "\"\n      />\n    ").trim(); // if options.withWebp is enabled, generate a webp version and change the image tag to a picture tag

                  if (!options.withWebp) {
                    _context.next = 31;
                    break;
                  }

                  _context.next = 27;
                  return fluid({
                    file: imageNode,
                    args: _.defaults({
                      toFormat: "WEBP"
                    }, // override options if it's an object, otherwise just pass through defaults
                      options.withWebp === true ? {} : options.withWebp, pluginOptions, defaults),
                    reporter: reporter
                  });

                case 27:
                  webpFluidResult = _context.sent;

                  if (webpFluidResult) {
                    _context.next = 30;
                    break;
                  }

                  return _context.abrupt("return", resolve());

                case 30:
                  imageTag = ("\n      <picture>\n        <source\n          srcset=\"" + webpFluidResult.srcSet + "\"\n          sizes=\"" + webpFluidResult.sizes + "\"\n          type=\"" + webpFluidResult.srcSetType + "\"\n        />\n        <source\n          srcset=\"" + srcSet + "\"\n          sizes=\"" + fluidResult.sizes + "\"\n          type=\"" + fluidResult.srcSetType + "\"\n        />\n        <img\n          class=\"" + imageClass + "\"\n          style=\"" + imageStyle + "\"\n          src=\"" + fallbackSrc + "\"\n          alt=\"" + (node.alt ? node.alt : defaultAlt) + "\"\n          title=\"" + (node.title ? node.title : "") + "\"\n        />\n      </picture>\n      ").trim();

                case 31:
                  ratio = 1 / fluidResult.aspectRatio * 100 + "%"; // Construct new image node w/ aspect ratio placeholder

                  showCaptions = options.showCaptions && node.title;
                  rawHTML = ("\n  <span\n    class=\"" + imageWrapperClass + "\"\n    style=\"position: relative; display: block; " + (showCaptions ? "" : options.wrapperStyle) + " max-width: " + presentationWidth + "px; margin-left: auto; margin-right: auto;\"\n  >\n    <span\n      class=\"" + imageBackgroundClass + "\"\n      style=\"padding-bottom: " + ratio + "; position: relative; bottom: 0; left: 0; background-image: url('" + fluidResult.base64 + "'); background-size: cover; display: block;\"\n    ></span>\n    " + imageTag + "\n  </span>\n  ").trim(); // Make linking to original image optional.

                  if (!inLink && options.linkImagesToOriginal) {
                    rawHTML = ("\n  <a\n    class=\"gatsby-resp-image-link\"\n    href=\"" + originalImg + "\"\n    style=\"display: block\"\n    target=\"_blank\"\n    rel=\"noopener\"\n  >\n    " + rawHTML + "\n  </a>\n    ").trim();
                  } // Wrap in figure and use title as caption


                  if (showCaptions) {
                    rawHTML = ("\n  <figure class=\"gatsby-resp-image-figure\" style=\"" + options.wrapperStyle + "\">\n    " + rawHTML + "\n    <figcaption class=\"gatsby-resp-image-figcaption\">" + node.title + "</figcaption>\n  </figure>\n      ").trim();
                  }

                  return _context.abrupt("return", rawHTML);

                case 37:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

      return function generateImagesAndUpdateNode(_x, _x2, _x3) {
        return _ref3.apply(this, arguments);
      };
    }();

  return Promise.all( // Simple because there is no nesting in markdown
    markdownImageNodes.map(function (_ref4) {
      var node = _ref4.node,
        inLink = _ref4.inLink;
      return new Promise(
        /*#__PURE__*/
        function () {
          var _ref5 = (0, _asyncToGenerator2.default)(
            /*#__PURE__*/
            _regenerator.default.mark(function _callee2(resolve, reject) {
              var fileType, rawHTML;
              return _regenerator.default.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      fileType = node.url.slice(-3); // Ignore gifs as we can't process them,
                      // svgs as they are already responsive by definition

                      if (!(isRelativeUrl(node.url) && fileType !== "gif" && fileType !== "svg")) {
                        _context2.next = 9;
                        break;
                      }

                      _context2.next = 4;
                      return generateImagesAndUpdateNode(node, resolve, inLink);

                    case 4:
                      rawHTML = _context2.sent;

                      if (rawHTML) {
                        // Replace the image node with an inline HTML node.
                        node.type = "html";
                        node.value = rawHTML;
                      }

                      return _context2.abrupt("return", resolve(node));

                    case 9:
                      return _context2.abrupt("return", resolve());

                    case 10:
                    case "end":
                      return _context2.stop();
                  }
                }
              }, _callee2, this);
            }));

          return function (_x4, _x5) {
            return _ref5.apply(this, arguments);
          };
        }());
    })).then(function (markdownImageNodes) {
      return (// HTML image node stuff
        Promise.all( // Complex because HTML nodes can contain multiple images
          rawHtmlNodes.map(function (_ref6) {
            var node = _ref6.node,
              inLink = _ref6.inLink;
            return new Promise(
              /*#__PURE__*/
              function () {
                var _ref7 = (0, _asyncToGenerator2.default)(
                  /*#__PURE__*/
                  _regenerator.default.mark(function _callee3(resolve, reject) {
                    var $, imageRefs, _i, thisImg, formattedImgTag, fileType, rawHTML;

                    return _regenerator.default.wrap(function _callee3$(_context3) {
                      while (1) {
                        switch (_context3.prev = _context3.next) {
                          case 0:
                            if (node.value) {
                              _context3.next = 2;
                              break;
                            }

                            return _context3.abrupt("return", resolve());

                          case 2:
                            $ = cheerio.load(node.value);

                            if (!($("img").length === 0)) {
                              _context3.next = 5;
                              break;
                            }

                            return _context3.abrupt("return", resolve());

                          case 5:
                            imageRefs = [];
                            $("img").each(function () {
                              imageRefs.push($(this));
                            });
                            _i = 0;

                          case 8:
                            if (!(_i < imageRefs.length)) {
                              _context3.next = 29;
                              break;
                            }

                            thisImg = imageRefs[_i];
                            // Get the details we need.
                            formattedImgTag = {};
                            formattedImgTag.url = thisImg.attr("src");
                            formattedImgTag.title = thisImg.attr("title");
                            formattedImgTag.alt = thisImg.attr("alt");

                            if (formattedImgTag.url) {
                              _context3.next = 16;
                              break;
                            }

                            return _context3.abrupt("return", resolve());

                          case 16:
                            fileType = formattedImgTag.url.slice(-3); // Ignore gifs as we can't process them,
                            // svgs as they are already responsive by definition

                            if (!(isRelativeUrl(formattedImgTag.url) && fileType !== "gif" && fileType !== "svg")) {
                              _context3.next = 26;
                              break;
                            }

                            _context3.next = 20;
                            return generateImagesAndUpdateNode(formattedImgTag, resolve, inLink);

                          case 20:
                            rawHTML = _context3.sent;

                            if (!rawHTML) {
                              _context3.next = 25;
                              break;
                            }

                            // Replace the image string
                            thisImg.replaceWith(rawHTML);
                            _context3.next = 26;
                            break;

                          case 25:
                            return _context3.abrupt("return", resolve());

                          case 26:
                            _i++;
                            _context3.next = 8;
                            break;

                          case 29:
                            // Replace the image node with an inline HTML node.
                            node.type = "html";
                            node.value = $("body").html(); // fix for cheerio v1

                            return _context3.abrupt("return", resolve(node));

                          case 32:
                          case "end":
                            return _context3.stop();
                        }
                      }
                    }, _callee3, this);
                  }));

                return function (_x6, _x7) {
                  return _ref7.apply(this, arguments);
                };
              }());
          })).then(function (htmlImageNodes) {
            return markdownImageNodes.concat(htmlImageNodes).filter(function (node) {
              return !!node;
            });
          })
      );
    });
};