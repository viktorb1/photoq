var photos = [];

// Called when the user pushes the "submit" button
function photoByNumber() {
    var keywords = document.getElementById("keywords").value;
    var message = document.getElementById("note");
    var reactEl = document.getElementById("react");
    var results = document.getElementById("results");

    if (keywords != ""){
        if (inputIsValid(keywords)) {
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
                        results.appendChild(searchQuery);
                    }

                    var urlStart = "http://lotus.idav.ucdavis.edu/public/ecs162/UNESCO/";

                    var first12photos = photos.slice(0,12);

                    for(let i = 0; i < first12photos.length; i++)
                        first12photos[i].src = urlStart + first12photos[i].filename;

                    app.setState({ photos: first12photos });

                }
            }
        } else {
                // hide react element
                reactEl.style.display = "none";
                message.style.display = "flex";
                message.textContent = "Invalid input, please try again!";
                results.style.display = "none";
        }
    } else {
        document.querySelector("#query").classList.add("toggle");
    }

    // from my server code
    function inputIsValid(url) {

        keywords = url.split(',');
        
        if (keywords.length == 0)
            return false;

        for(let i = 0; i < keywords.length; i++)
            if (/[0-9!@#$%^&*()_-_/<>\[\]\{\\\/|\}`~]/.test(keywords[i]))
                return false;

        return true;
    }
}


function toggleSearchBar() {
        document.querySelector("#query").classList.remove("toggle");
        document.querySelector("#query input").select();
}



// A react component for a tag
class Tag extends React.Component {

    render () {
    return React.createElement('p',  // type
        { className: 'tagText'}, // properties
       this.props.text);  // contents
    }
};


// A react component for controls on an image tile
class TileControl extends React.Component {

    render () {
    // remember input vars in closure
        var _selected = this.props.selected;
        var _src = this.props.src;
        // parse image src for photo name
    var photoName = _src.split("/").pop();
    photoName = photoName.split('%20').join(' ');

        return ( React.createElement('div',
     {className: _selected ? 'selectedControls' : 'normalControls'},
         // div contents - so far only one tag
              React.createElement(Tag,
         { text: photoName })
        )// createElement div
    )// return
    } // render
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
        React.createElement('div',
            {style: {margin: this.props.margin, width: _photo.width},
             className: 'tile',
                         onClick: function onClick(e) {
                console.log("tile onclick");
                // call Gallery's onclick
                return _onClick (e,
                         { index: _index, photo: _photo })
                }
         }, // end of props of div
         // contents of div - the Controls and an Image
        React.createElement(TileControl,
            {selected: _selected,
             src: _photo.src}),
        React.createElement('img',
            {className: _selected ? 'selected' : 'normal',
                     src: _photo.src,
             width: _photo.width,
                     height: _photo.height
                })
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
