var photos = [];

// Called when the user pushes the "submit" button
function photoByNumber() {
    hideAutocomplete();
    var keywords = autocomplete.state.selectedTags.slice();
    autocomplete.setState({ selectedTags: [] })
    document.getElementById("keywords").value = '';
    var message = document.getElementById("note");
    var reactEl = document.getElementById("react");
    var results = document.getElementById("results");
    hideAutocomplete();
    document.querySelector("#query").classList.add("toggle");

    if (keywords.length > 0) {
        var oReq = new XMLHttpRequest();
        var url = encodeURIComponent("query?keyList=" + keywords.join('+'));

        oReq.open("GET", url);
        oReq.addEventListener("load", respCallback);
        oReq.send();

        function respCallback() {
            var resobj = JSON.parse(oReq.responseText)
            photos = resobj.rows;
            var query = document.getElementById("query");

            if (oReq.status == 400) {
                message.textContent = "Sorry, your request failed!";
                message.style.display = "flex";
                reactEl.style.display = "none"
                results.style.display = "none";
            } else if (photos.length == 0) {
                message.textContent = resobj.message;
                message.style.display = "flex";
                reactEl.style.display = "none"
                results.style.display = "none";
            } else {
                document.querySelector("#query").classList.add("toggle")
                message.style.display = "none";
                reactEl.style.display = "block";
                results.style.display = "flex";

                var previousQuery = document.querySelectorAll(".searchQueries");

                for(let i = 0; i < previousQuery.length; i++)
                    results.removeChild(previousQuery[i]);

                for(let i = 0; i < keywords.length; i++)
                {
                    var searchQuery = document.createElement("p");
                    searchQuery.textContent = keywords[i];
                    searchQuery.className = "searchQueries";
                    var queryRemover = document.createElement("a");
                    queryRemover.href = '#';
                    queryRemover.textContent = '✕';
                    queryRemover.className = 'remove-query';
                    queryRemover.dataset.query = keywords[i];

                    queryRemover.addEventListener('click', function(e) {
                        e.preventDefault();
                        console.log('removing', e.target.dataset.query);
                        var index = keywords.indexOf(e.target.dataset.query);
                        keywords.splice(index, 1);
                        document.getElementById("keywords").value = keywords.join(',');
                        photoByNumber();
                    })
                    searchQuery.appendChild(queryRemover);
                    results.appendChild(searchQuery);
                }

                var urlStart = "https://raw.githubusercontent.com/viktorb1/images/master/UNESCO/";


                var first12photos = photos.slice(0,12);

                for(let i = 0; i < first12photos.length; i++) {
                    first12photos[i].src = urlStart + first12photos[i].filename;
                }

                app.setState({ photos: first12photos });
                window.dispatchEvent(new Event('resize'));

            }
        }
    } else {
        // hide react element
        reactEl.style.display = "none";
        message.style.display = "flex";
        message.textContent = "You have no search terms in your input.";
        results.style.display = "none";
    }
}


function toggleSearchBar() {
        document.querySelector("#query").classList.remove("toggle");
        document.querySelector("#query input").select();
}



// A react component for a tag
class Tag extends React.Component {
    remove(e) {
        e.stopPropagation();
        this.props.remove(this.props.text);
    }

    render () {
        return React.createElement(
            'p',
            { className: 'tagText' },
            this.props.text,
            React.createElement(
                'a',
                {
                    className: 'remove-tag',
                    onClick: this.remove.bind(this)
                },
                '✕'
            )
        );  // contents
    }
};

class TagInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = { text: '' };
    }

    add(e) {
        e.stopPropagation();
        if (this.state.text != "" && !this.state.text.includes(',')) {
            this.props.add(this.state.text);
        }
    }

    render () {
        return React.createElement(
            'div',  // type
            { className: 'add-new-tag' }, // properties
            React.createElement('input', {
                type: 'text',
                value: this.state.text,
                onClick: e => { e.stopPropagation() },
                onKeyDown: e => {
                    // enter was pressed
                    if (e.keyCode == 13) {
                        this.add(e);
                    }
                },
                onChange: e => {
                    this.setState({ text: e.target.value });
                },
            }),
            React.createElement(
                'a',
                {
                    className: 'add-tag',
                    onClick: this.add.bind(this)
                },
                '+'
            )
        );  // contents
    }
};

// A react component for controls on an image tile
class TileControl extends React.Component {
    constructor(props) {
        super(props);
        this.state = { tags: this.props.tags.split(',') };
    }

    removeTag(tag) {
        var newTags = this.state.tags;
        var index = newTags.indexOf(tag);
        newTags.splice(index, 1);

        var oReq = new XMLHttpRequest();
        var url = encodeURIComponent("updateTags?idNum=" + this.props.photoId + '&tags=' + newTags.join(','));

        oReq.open("GET", url);
        oReq.addEventListener("load", function() {
            this.setState({ tags: newTags });
        }.bind(this));
        oReq.send();
    }

    addTag(tag) {
        var newTags = this.state.tags;
        newTags.push(tag);
        newTags = Array.from(new Set(newTags));

        var oReq = new XMLHttpRequest();
        var url = encodeURIComponent("updateTags?idNum=" + this.props.photoId + '&tags=' + newTags.join(','));

        oReq.open("GET", url);
        oReq.addEventListener("load", function() {
            this.setState({ tags: newTags });
        }.bind(this));
        oReq.send();
    }

    render () {
        // remember input vars in closure
        var _selected = this.props.selected;
        var _src = this.props.src;
        var _tags = this.state.tags;
        // parse image src for photo name
        var photoNames = _src.split("/").pop();
        photoNames = photoNames.split('%20'); //.join(' ');

        var args = [];
        args.push( 'div' );
        args.push( { className: _selected ? 'selectedControls' : 'normalControls'} )

        for (var i = 0; i < _tags.length; i++)
            args.push(
                React.createElement(
                    Tag,
                    {
                        remove: this.removeTag.bind(this),
                        text: _tags[i],
                        parentImage: _src
                    }
                )
            );

        if (_tags.length < 7) {
            args.push(React.createElement(TagInput, { add: this.addTag.bind(this) }));
        }

        return (React.createElement.apply(null, args));
    }
};



// A react component for an image tile
class ImageTile extends React.Component {
    render() {
        // onClick function needs to remember these as a closure
        var _onClick = this.props.onClick;
        var _index = this.props.index;
        var _photo = this.props.photo;
        let _selected = _photo.selected; // this one is just for readability

        return (
            React.createElement(
                'div',
                {
                    style: {margin: this.props.margin, width: _photo.width},
                    className: 'tile',
                    onClick: function onClick(e) {
                        // call Gallery's onclick
                        return _onClick (e, { index: _index, photo: _photo })
                    }
                },

                // contents of div - the Controls and an Image
                React.createElement(
                    TileControl,
                    {
                        selected: _selected,
                        photoId: _photo.idNum,
                        src: _photo.src,
                        location: _photo.location,
                        tags: _photo.tags
                    },
                ),


                React.createElement(
                    'img',
                    {
                        className: _selected ? 'selected' : 'normal',
                        src: _photo.src,
                        width: _photo.width,
                        height: _photo.height,
                    }
                )
            )//createElement div
        ); // return
    } // render
} // class

// The react component for the whole image gallery
// Most of the code for this is in the included library
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = { photos: photos , width: window.innerWidth};
        this.selectTile = this.selectTile.bind(this);
    }

    selectTile(event, obj) {
        let photos = this.state.photos;
        photos[obj.index].selected = !photos[obj.index].selected;
        this.setState({ photos: photos });
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleWindowSizeChange);
    }

    // make sure to remove the listener
    // when the component is not mounted anymore
    componentWillUnmount() {
        window.removeEventListener('resize', this.handleWindowSizeChange);
    }

    handleWindowSizeChange() {
        app.setState({ width: window.innerWidth });
    };

    render() {
        const { width } = this.state;
        const isMobile = (width <= 600);

        if(isMobile)
            return (React.createElement( Gallery, {photos: this.state.photos,
           onClick: this.selectTile,
           ImageComponent: ImageTile, columns: 1} ));
        else
           return (React.createElement( Gallery, {photos: this.state.photos,
           onClick: this.selectTile,
           ImageComponent: ImageTile, columns: 2} ));
  }

}

const reactContainer = document.getElementById("react");
var app = ReactDOM.render(React.createElement(App),reactContainer);

class KeywordSelected extends React.Component {
    remove(e) {
        e.preventDefault();
        this.props.remove(this.props.text);
    }

    render() {
        return (
            React.createElement(
                "div",
                { className: "suggested-tags" },
                React.createElement(
                    "p",
                    { className: "tagText" },
                    this.props.text,
                    React.createElement(
                        "a",
                        { className: "remove-tag", onClick: this.remove.bind(this) },
                        "\u2715"
                    )
                )
            )
        );
    }
}

class KeywordSuggestion extends React.Component {
    add(e) {
        e.preventDefault();
        this.props.add(this.props.text);
    }

    render() {
        var className = this.props.type === 'landmark' ? 'suggested-landmark' : 'suggested-tag';
        return (
            React.createElement(
                "div",
                { className: "suggested-tags" },
                React.createElement(
                    "p",
                    { className: "tagText " + className },
                    this.props.text
                ),
                React.createElement(
                    "button",
                    { type: "button" },
                    React.createElement(
                        "p",
                        { className: "material-icons", onClick: this.add.bind(this) },
                        "arrow_back"
                    )
                )
            )
        );
    }
}

class AutoComplete extends React.Component {
    constructor(props) {
        super(props);
        this.state = { selectedTags: [], tags: [] };
    }

    addTag(tag) {
        document.getElementById("keywords").value = '';
        this.setState({
            selectedTags: this.state.selectedTags.concat([tag]),
            tags: [],
        })
    }

    removeTag(tag) {
        var newTags = this.state.selectedTags;
        var index = newTags.indexOf(tag);
        newTags.splice(index, 1);
        this.setState({ selectedTags: newTags })
    }

    render() {
        var selectedTagsElements = [];
        var searchTagsElements = [];
        var selectedTags = new Set(this.state.selectedTags);
        var searchTags = new Set(this.state.tags.filter(x => !selectedTags.has(x)));

        selectedTags.forEach(tag  => {
            selectedTagsElements.push(
                React.createElement(
                    KeywordSelected, {
                        key: 'selected-tag-' + tag,
                        text: tag,
                        remove: this.removeTag.bind(this),
                    }
                )
            );
        })

        searchTags.forEach(tag => {
            searchTagsElements.push(
                React.createElement(
                    KeywordSuggestion, {
                        key: 'tag-' + tag,
                        text: tag,
                        type: 'tag',
                        add: this.addTag.bind(this),
                    }
                )
            );
        })

        return (
            React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    { id: "selected-tags" },
                    selectedTagsElements,
                ),
                React.createElement(
                    "p",
                    { className: "ab-message" },
                    'Press tab to create a tag & enter to search',
                ),
                React.createElement(
                    "div",
                    { id: "suggestion-box", style: { display:  'block' } },
                    React.createElement(
                        "p",
                        { className: "ab-message" },
                        searchTags.size >  0 ? "Suggested Tags" : "No tags found"
                    ),
                    searchTagsElements,
                )
            )
        );
    }
}

const autocompleteContainer = document.getElementById("autocomplete-box");
var autocomplete = ReactDOM.render(React.createElement(AutoComplete), autocompleteContainer);

function showAutocomplete() {
    var acb = document.getElementById("autocomplete-box");
    acb.style.display = "block";
}

function hideAutocomplete() {
    var acb = document.getElementById("autocomplete-box");
    acb.style.display = "none";
}

function searchInput(e) {
    if (e.target.value.length >= 1) {
        showAutocomplete();
    } else {
        hideAutocomplete();
        return;
    }

    if (e.target.value.length == 1) {
        autocomplete.setState({ tags: [] });
        return;
    }

    var oReq = new XMLHttpRequest();
    var url = encodeURIComponent("query?autocomplete=" + e.target.value);

    oReq.open("GET", url);
    oReq.addEventListener("load", respCallback);
    oReq.send();
    autocomplete.setState({ tags: [] });

    function respCallback() {
        var resp = JSON.parse(oReq.responseText);
        autocomplete.setState({ tags: Object.keys(resp.tags || []) });
    }
}

function searchKeyDown(e) {
    if (e.keyCode == 13) {
        photoByNumber();
        return;
    }

    if (e.keyCode == 9) {
        e.preventDefault();
        autocomplete.addTag(document.getElementById("keywords").value);
    }
}
