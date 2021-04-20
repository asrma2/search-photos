import React, { Component } from 'react';
import cookie from "react-cookies";
import { debounce } from "lodash";
import { Row, Col, Input, Tag, Tooltip, Button } from 'antd';
import { flickrKey } from "../utils/const";
import Gallery from 'react-grid-gallery';
import InfiniteScroll from "react-infinite-scroll-component";

import '../asset/style/search-photos.css';

export class SearchPhotos extends Component {

    constructor(props) {
        super(props);

        let previouslySearchedItemsString = cookie.load('searches');
        let previouslySearchedItemsArray = [];
        if (previouslySearchedItemsString != null && previouslySearchedItemsString != undefined && previouslySearchedItemsString != '') {
            previouslySearchedItemsArray = previouslySearchedItemsString.split(',');
        }

        this.state = {
            defaultImagesPageCount: 1,
            totalImagesFetched: [],
            search: '',
            searchMode: false,
            previouslySearchedItems: previouslySearchedItemsArray,
        }
        this.debounceHandleChange = debounce(this.debounceHandleChange.bind(this), 1000);
        this.handleChange = this.handleChange.bind(this);
        this.perPageImages = 50;
        this.previousSearchResultsSize = 10;
    }

    componentDidMount = () => {
        this.getPhotos();
    }

    componentDidUpdate = (prevProps, prevState) => {
        if (prevState.searchMode != this.state.searchMode && !this.state.searchMode) {
            this.getPhotos();
        }
    }

    getPhotos = () => {
        let self = this;
        let url = ``;
        if (this.state.searchMode) {        
            url = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${flickrKey}&tags=${this.state.search}&format=json&nojsoncallback=1&page=${this.state.defaultImagesPageCount}&per_page=${this.perPageImages}`;
        } else {
            url = `https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&api_key=${flickrKey}&format=json&nojsoncallback=1&page=${this.state.defaultImagesPageCount}&per_page=${this.perPageImages}`;
        }

        fetch(url)
            .then(function(response) {
                return response.json();
            })
            .then(function(res) {
                let picArray = res.photos.photo.map((pic) => {
                    var srcPath = 'https://farm' + pic.farm + '.staticflickr.com/' + pic.server + 
                        '/' +pic.id + '_' + pic.secret + '.jpg';
                    return ({
                        src: srcPath,
                        thumbnail: srcPath,
                        thumbnailWidth: 320,
                        thumbnailHeight: 174,
                    });
                });
                self.setState({
                    totalImagesFetched: [...self.state.totalImagesFetched, ...picArray],
                    defaultImagesPageCount: self.state.defaultImagesPageCount + 1,
                });
            })
            .catch((error) => {
                console.log("Not able to fetch images!!!")
            });
    }

    componentWillUnmount = () => {
    }

    handleChange = (e) => {
        this.setState({
            search: e.target.value,
        });
        this.debounceHandleChange(e.target.value);
    }

    debounceHandleChange = (value) => {
        if (value == undefined || value == '') {
            this.setState({
                defaultImagesPageCount: 1,
                totalImagesFetched: [],
                search: '',
                searchMode: false,
            });
        } else {
            let self = this;

            let url = `https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=${flickrKey}&tags=${value}&format=json&nojsoncallback=1&page=1&per_page=${this.perPageImages}`;

            fetch(url)
                .then(function(response) {
                    return response.json();
                })
                .then(function(res) {
                    let picArray = res.photos.photo.map((pic) => {
                        var srcPath = 'https://farm' + pic.farm + '.staticflickr.com/' + pic.server + 
                            '/' +pic.id + '_' + pic.secret + '.jpg';
                        return ({
                            src: srcPath,
                            thumbnail: srcPath,
                            thumbnailWidth: 320,
                            thumbnailHeight: 174,
                        });
                    });

                    let previouslySearchedItems = [...self.state.previouslySearchedItems];
                    previouslySearchedItems.unshift(value);
                    if (previouslySearchedItems.length > self.previousSearchResultsSize) {
                        previouslySearchedItems = previouslySearchedItems.slice(0, self.previousSearchResultsSize);
                    }

                    let updatedItems = [];

                    for (let i = 0; i < previouslySearchedItems.length; i++) {
                        if (!updatedItems.includes(previouslySearchedItems[i])) {
                            updatedItems.push(previouslySearchedItems[i]);
                        }
                    }

                    self.setState({
                        totalImagesFetched: picArray,
                        defaultImagesPageCount: 1,
                        searchMode: true,
                        previouslySearchedItems: updatedItems,
                    });

                    cookie.save('searches', updatedItems.join(','), { path: '/' });
                })
                .catch((error) => {
                    console.log("Not able to fetch images!!!")
                });
        }
    }

    searchRecentItem = (value) => {
        if (this.state.search != value) {
            this.setState({
                defaultImagesPageCount: 1,
                totalImagesFetched: [],
                search: value,
                searchMode: false,
            });
            this.debounceHandleChange(value);
        }
    }

    clearSearch = () => {
        if (this.state.search != '') {
            this.setState({
                defaultImagesPageCount: 1,
                totalImagesFetched: [],
                search: '',
                searchMode: false,
            });
        }
    }

    render() {
        
        return (
            <div key="view">
                <Row>
                    <Col span={24}>
                        <Row>
                            <Col span={24}>
                                <h3>Search Images</h3>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={12} offset={6}>
                                <Input value={this.state.search} onChange={this.handleChange} />
                            </Col>
                            <Col offset={1} span={2}>
                                <Button danger onClick={this.clearSearch}>Clear</Button>
                            </Col>
                        </Row>
                        {this.state.previouslySearchedItems.length > 0 ?
                            <div>
                                <br />
                                <Row>
                                    <Col span={2} offset={1}>
                                        {"Recent Searches: "}
                                    </Col>
                                    <Col span={20} style={{textAlign: 'left'}}>
                                        <div>
                                            {this.state.previouslySearchedItems.map((tag, index) => {
                                                const isLongTag = tag.length > 10;
                                                let color = 'magenta';
                                                let tagElem = (
                                                    <Tag key={tag} color={color} style={{cursor: 'pointer'}}
                                                        onClick={() => this.searchRecentItem(tag)}>
                                                        {isLongTag ? `${tag.slice(0, 10)}...` : tag}
                                                    </Tag>
                                                );
                                                return isLongTag ? <Tooltip title={tag} key={tag}>{tagElem}</Tooltip> : tagElem;
                                            })}
                                        </div>
                                    </Col>
                                </Row>
                            </div> : null
                        }
                    </Col>
                </Row>
                <br />
                <Row>
                    <Col>
                        <InfiniteScroll
                            dataLength={this.state.totalImagesFetched.length}
                            next={this.getPhotos}
                            hasMore={true}
                            loader={<h4>Loading...</h4>}
                        >
                            <Gallery 
                                images={this.state.totalImagesFetched} 
                                enableImageSelection={false}
                            />
                        </InfiniteScroll>
                    </Col>
                </Row>
            </div>
        )
    }
}
