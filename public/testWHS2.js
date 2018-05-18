// Called when the user pushes the "submit" button
var photos;




function photoByNumber() {

    var nums = document.getElementById("num").value;

    if (inputIsValid(nums)) {
        var oReq = new XMLHttpRequest();
        var url = "query?numList=" + nums.join('+');

        oReq.open("GET", url);
        oReq.addEventListener("load", respCallback);
        oReq.send();

        function respCallback() {
            photos = JSON.parse(oReq.responseText);
            var query = document.getElementById("query");
            var display = document.getElementById("photoImg");
            var errorMessage = document.getElementById("errorMessage");

            if (oReq.status == 400) {
                if(!errorMessage) {
                    display.src = "";
                    var errorText = document.createElement("p");
                    errorText.id = "errorMessage";
                    errorText.textContent = "Sorry, your request failed!";
                    query.appendChild(errorText);
                }
            } else {
                if(errorMessage)
                    errorMessage.remove();

                var urlStart = "http://lotus.idav.ucdavis.edu/public/ecs162/UNESCO/";

                for(let i = 0; i < photos.length; i++) {
                    photos[i].src = urlStart + photos[i].filename; // don't need this yet
                    
                    console.log(photos[i].filename);
                }

                const reactContainer = document.getElementById("react");

                ReactDOM.render(React.createElement(App),reactContainer);

            }
        }
    }
    

    // from my server code
    function inputIsValid(url) {
        nums = url.split(',').map(Number);
        
        if (nums.length == 0)
            return false;

        for(let i = 0; i < nums.length; i++) {
            if (isNaN(nums[i]))
                return false;
            else if (nums[i] < 0)
                return false;
            else if (nums[i] > 988)
                return false;
            else if (!Number.isInteger(nums[i]))
                return false;
        }

        return true;
    }
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
    var _selected = _photo.selected; // this one is just for readability

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
    this.state = { photos: photos };
    this.selectTile = this.selectTile.bind(this);
  }

  selectTile(event, obj) {
    console.log("in onclick!", obj);
    let photos = this.state.photos;
    photos[obj.index].selected = !photos[obj.index].selected;
    this.setState({ photos: photos });
  }

  render() {
    return (
       React.createElement( Gallery, {photos: photos, 
           onClick: this.selectTile, 
           ImageComponent: ImageTile} )
        );
  }

}
