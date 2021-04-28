'use strict';

		/* --- Snap2HTML Code --- */
	
		var dirs = [];	// contains all directories
		var i = 0;		// counter for initializing dirs

[DIR DATA]

		$(document).ready(function(){

			var SelectedFolderID = "-1";
			var PreviouslySelectedFolder = null;

			/* ---  Init --- */

			$("#tot_size").text( bytesToSize( $("#tot_size").text() ) );

			$("#loading").remove();
			$("#content").show();

			$("#content").height( $("#wrapper").outerHeight(true) - $("#top").outerHeight(true) -1 );
			
			$("#content").splitter( { sizeLeft: 200 } );

			// prepare parent folder lookup
			var parent_folders = [];
			parent_folders[0] = 0;
			var numDirs = dirs.length;
			for( var id=0; id< numDirs; id++ ) {
				var subdirs = getSubdirs( id );
				if( subdirs != "" ) {
					for( var c=0; c<subdirs.length; c++ ) {
						parent_folders[ subdirs[c] ] = id;
					}
				}
			}

			/* --- Events --- */

			$("#search_form").submit(function(){
				return false;
			});

			// handle clicks on folders in file list
			$("body").delegate("a.folder_link", "click", function() { 
				var tree = $("#tree").dynatree("getTree");
				var node = tree.getNodeByKey( $(this).attr('id') );
				node.activate();
				return false; 
			});

			// search delayer
			var delay = ( function() {
			  var timer = 0;
			  return function(callback, ms) {
				clearTimeout (timer);
				timer = setTimeout(callback, ms);
			  };
			})();

			// search for files
			var SearchFilenames = [];
			var SearchLocations = [];
			var SearchLocationsID = [];
			var SearchIsDir = [];

			$("#search_text").keyup( function(event) {

				var iDelay = 250;
				var PreviouslySelectedNode = null;
				if( [NUM FILES] > 1000 ) iDelay = 1000;
				if(event.keyCode==='13') iDelay = 0;		// 13 = enter key

				delay( function() {

					var sSearchFor = $("#search_text").val().toLowerCase();

					if( sSearchFor === "" )
					{
						if( PreviouslySelectedNode != null )
						{
							PreviouslySelectedNode.activate();
							PreviouslySelectedFolderID = -1;
						}
						return;
					}
					
					if( sSearchFor === "*" ) sSearchFor = "";

					if( SelectedFolderID != -1 )
					{
						PreviouslySelectedNode = $("#tree").dynatree("getActiveNode");
						SelectedFolderID = "-1";
						$("#tree").dynatree("getActiveNode").deactivate();
					}

					$("#path_info").html( "<b>&gt;&gt;</b> Search results:" );

					var link_protocol = "[LINK PROTOCOL]";
					var link_root = "[LINK ROOT]";
					var source_root = "[SOURCE ROOT]";
					var source_parent = source_root.substring( 0, source_root.lastIndexOf("/") +1 );
					var hide_root = ( link_root != "" &&  link_root.substring(0,source_root.length) != source_root );
					var numDirs = dirs.length;
					var c;

					// if no previous search, do some pre-processing for faster search
					if( SearchFilenames.length === 0 )
					{
						var nFound = 0;
						for( c=1; c<numDirs; c++ ) // dirs first...
						{
							SearchFilenames[nFound] = dirs[c][0].split("*");
							SearchFilenames[nFound][0] = getDirName( c );
							SearchFilenames[nFound][3] = SearchFilenames[nFound][0];		// keep original name (in non-lowercase)
							SearchFilenames[nFound][0] = SearchFilenames[nFound][0].toLowerCase();
							SearchFilenames[nFound][1] = Number(SearchFilenames[nFound][1]);
							if( hide_root )
								SearchLocations[nFound] = getDirNameAndPath(c).substring(source_parent.length);
							else
								SearchLocations[nFound] = getDirNameAndPath(c);
							SearchLocationsID[nFound] = c;
							SearchIsDir[nFound] = true;
							nFound++;
						}
						for( c=0; c< numDirs; c++ ) // ...then all files
						{
							var arrLength = dirs[c].length;
							for( var c2=1; c2< arrLength-2; c2++ )
							{
								SearchFilenames[nFound] = dirs[c][c2].split("*");
								SearchFilenames[nFound][3] = SearchFilenames[nFound][0];		// keep original name (in non-lowercase)
								SearchFilenames[nFound][0] = SearchFilenames[nFound][0].toLowerCase();
								SearchFilenames[nFound][1] = Number(SearchFilenames[nFound][1]);
								//SearchLocations[nFound] = getDirNameAndPath(c);
								if( hide_root )
									SearchLocations[nFound] = getDirNameAndPath(c).substring(source_parent.length);
								else
									SearchLocations[nFound] = getDirNameAndPath(c);

								SearchLocationsID[nFound] = c;
								SearchIsDir[nFound] = false;
								nFound++;
							}
						}
					}

					var table_html = "";
					table_html += "<table id='files' class='tablesorter'><thead><tr><th>Name</th><th>Folder</th><th>Size</th><th>Modified</th></tr></thead><tbody>\n";

					var countFiles = 0;
					var countDirs = 0;
					var tot_size = 0;
					for( c=0; c< SearchFilenames.length; c++ )
					{
						if( SearchFilenames[c][0].indexOf(sSearchFor) >= 0 )
						{
							var file_tmp = SearchFilenames[c][0];
							var dir_tmp = getDirNameAndPath(SearchLocationsID[c]).substring(source_root.length);
							if( dir_tmp != "" ) dir_tmp += "/";

							if( SearchIsDir[c] === true )
							{
								countDirs++;
								//var located_in = SearchLocations[c];
								//if( located_in === "" ) located_in = "[.]"
								var subdir_id = parent_folders[ SearchLocationsID[c] ];
								table_html += "<tr><td><span class='file_folder'><a href=\"#\" class=\"folder_link\" id=\"" + SearchLocationsID[c] + "\"> " + SearchFilenames[c][3] + "</a></span></td><td><span class='file_folder'><a href=\"#\" class=\"folder_link\" id=\"" + subdir_id + "\"> " + getDirNameAndPath(subdir_id) + "</a></span></td><td>" + bytesToSize( SearchFilenames[c][1] ) + "</td><td>" + SearchFilenames[c][2] + "</td></tr>\n";
							}
							else	// files
							{
								tot_size += SearchFilenames[c][1];
								countFiles++;

								if( [LINK FILES] )
								{
									file_tmp = link_protocol + link_root + dir_tmp.replace("\\","/") + SearchFilenames[c][3] + "\">" + SearchFilenames[c][3] + "</a>";
									if( navigator.userAgent.toLowerCase().indexOf("msie") >= 0  &&  link_protocol.indexOf("file:") >= 0 )
									{
										file_tmp = "javascript:alert('Internet Explorer does not allow linking to local files...')" + "\">" + SearchFilenames[c][3] + "</a>";
									}
									if( file_tmp.substr(0,1) === "/" ) file_tmp = file_tmp.substr(1);
									file_tmp = file_tmp.replace(/\\/g,"/");
									file_tmp = file_tmp.replace(/#/g,"%23");
								
									var indx = file_tmp.indexOf("://");
									if( indx != -1 )
									{
										var protocol_tmp = file_tmp.substr(0,indx+3);
										file_tmp = file_tmp.substr(indx+3);
										file_tmp = file_tmp.replace(/\/\//g,"/");
										file_tmp = protocol_tmp + file_tmp;
									}
									else
									{
										file_tmp = file_tmp.replace(/\/\//g,"/");
									}

									file_tmp = "<a href=\"" + file_tmp;
								}

								var located_in = SearchLocations[c];
								if( located_in === "" ) located_in = "[.]"
								table_html += "<tr><td><span class='file'>" + file_tmp + "</span></td><td><span class='file_folder'><a href=\"#\" class=\"folder_link\" id=\"" + SearchLocationsID[c] + "\"> " + located_in + "</a></span></td><td>" + bytesToSize( SearchFilenames[c][1] ) + "</td><td>" + SearchFilenames[c][2] + "</td></tr>\n";
							}

						}
					}
					table_html += "</tbody></table>\n";
					
					$("#file_list").html( table_html );
					$("#files").tablesorter( { sortInitialOrder: "desc" } );
					
					var sFiles = " files ("; if(countFiles===1) sFiles = " file (";
					var sDirs = " folders"; if(countDirs===1) sDirs = " folder";
					$("#num_files").html( countDirs + sDirs + "<br>" + countFiles + sFiles + bytesToSize( tot_size , 0 )+ ")" );

					return false;
					
				}, iDelay );
			});


			// show folder content
			function ShowFolder( FolderID )
			{
				if( SelectedFolderID === FolderID ) return false;
				$("#" + SelectedFolderID ).removeClass("bold");
				SelectedFolderID = FolderID;

				$("#search_text").val("");
			
				var link_protocol = "[LINK PROTOCOL]";
				var link_root = "[LINK ROOT]";
				var source_root = "[SOURCE ROOT]";
				var source_parent = source_root.substring( 0, source_root.lastIndexOf("/") +1 );
				var hide_root = ( link_root != "" &&  link_root.substring(0,source_root.length) != source_root );

				var path_info = dirs[FolderID][0].split("*")[0].replace(/\:\\/g,"<span class='path_divider'></span>").replace(/\\/g,"<span class='path_divider'></span>");
				

				if( hide_root )
					$("#path_info").html( path_info.substring(source_parent.length) );
				else
					$("#path_info").html( path_info );

				var table_html = "";
				table_html += "<table id='files' class='tablesorter'><thead><th>Name</th><th>Size</th><th>Modified</th></tr></thead><tbody>\n";

				var countFiles = 0;
				var countDirs = 0;
				var subdirTotSizes = 0;
				var c;

				// folders
				if( FolderID != 0 ) table_html += "<tr><td><span class='file_folder'><a href=\"#\" class=\"folder_link\" id=\"" + parent_folders[FolderID] + "\"> [..]</a></span></td><td></td><td></td></tr>\n";
				var subdirs = getSubdirs( SelectedFolderID );
				if( subdirs != "" )
				{
					for( c=0; c< subdirs.length; c++ )
					{
						countDirs++;
						var sTmp = dirs[ subdirs[c] ][0].split("*");
						var name = sTmp[0].substring( sTmp[0].lastIndexOf("\\") +1 );
						var dirSize = getDirTreeSize( subdirs[c] );
						subdirTotSizes += dirSize;
						table_html += "<tr><td><span class='file_folder'><a href=\"#\" class=\"folder_link\" id=\"" + subdirs[c] + "\"> " + name + "</a></span></td><td>" + bytesToSize( dirSize ) + "</td><td>" + sTmp[2] + "</td></tr>\n";
					}
				}

				// files
				for( c=1; c< dirs[ SelectedFolderID ].length-2; c++ )
				{
					countFiles++;
					var sTmp = dirs[ SelectedFolderID ][c].split("*");
					var file_tmp = sTmp[0];
					var dir_tmp = getDirNameAndPath(SelectedFolderID).substring(source_root.length);
					if( dir_tmp != "" ) dir_tmp += "/";
					var temp = dir_tmp.split("\\");
					var indexlink = "";
					for( var u=3; u<temp.length; u++){
						indexlink = indexlink + temp[u] + "/";
					}
					table_html += "<tr><td><span class='file'><a href=\'https:\/\/player.adityashri.tk\/"+ indexlink + sTmp[0] + "'>"+ sTmp[0] + "</a></span></td><td>" + bytesToSize( sTmp[1] ) + "</td><td>" + sTmp[2] + "</td></tr>\n";
				}

				table_html += "</tbody></table>\n";

				$("#file_list").html( table_html );
				$("#files").tablesorter( { sortInitialOrder: "desc" } );

				var sFiles = " files ("; if(countFiles===1) sFiles = " file (";
				var sDirs = " folders ("; if(countDirs===1) sDirs = " folder (";
				$("#num_files").html( countDirs + sDirs + bytesToSize( subdirTotSizes )+ ")<br>" + countFiles + sFiles + bytesToSize( dirs[ SelectedFolderID ][ dirs[ SelectedFolderID ].length-2 ] )+ ")" );

				$("#" + SelectedFolderID ).addClass("bold");

				return false;
			}


			/* --- Treeview --- */

			function PopulateTreeviewNode( node ) {
				var subdirs = getSubdirs( node.data.key );
				if( subdirs != "" )
				{
					for( var c=0; c<subdirs.length; c++ )
					{
						var newNode = node.addChild({
							title: getDirName( subdirs[c] ),
							key: subdirs[c],
							unselectable: true,
							isFolder: true,
						});
						PopulateTreeviewNode( newNode )
					}
				}
			}

			$("#tree").dynatree({
				clickFolderMode: 1,
				minExpandLevel: 2,
				fx: { height: "toggle", duration: 100 },
				onActivate: function(node) {
					ShowFolder( node.data.key );
				},
				onDblClick: function(node) {
					node.expand( !node.isExpanded() );
				},
			});

			// init treeview items
			var rootNode = $("#tree").dynatree("getRoot").addChild({
				title: getDirName( 0 ),
				key: "0",
				isFolder: true,
			});
            rootNode.tree.enableUpdate(false);
            PopulateTreeviewNode( rootNode );
            rootNode.tree.enableUpdate(true);
            rootNode.activate();


			/* --- Helper Functions --- */

			function getDirName( id ) {
				if( dirs.length <= id ) return "";
				var tmp = dirs[id][0].split("*");
				var tmp2 = tmp[0].substring(tmp[0].lastIndexOf("\\")+1);
				if( tmp2 === "" ) return tmp[0]; else return tmp2;
			}

			function getDirNameAndPath( id ) {
				if( dirs.length <= id ) return "";
				var tmp = dirs[id][0].split("*");
				return tmp[0];
			}

			function getSubdirs( id ) {
				if( dirs.length <= id ) return "";
				return dirs[id][ dirs[id].length-1 ].split("*");
			}

			function getDirSize( id ) {
				if( dirs.length <= id ) return "0";
				return dirs[id][ dirs[id].length-2 ];
			}

			function getDirTreeSize( id ) {
				if( dirs.length <= id ) return "0";
				var totSize = getDirSize(id);
				var subdirs = getSubdirs( id );
				if( subdirs != "" )
				{
					for( var c=0; c<subdirs.length; c++ )
					{
						totSize += getDirTreeSize( subdirs[c] );
					}
				}
				return totSize;
			}

			function bytesToSize(bytes) {  
				var kilobyte = 1024;
				var megabyte = kilobyte * 1024;
				var gigabyte = megabyte * 1024;
				var terabyte = gigabyte * 1024;
			   
				if ((bytes >= 0) && (bytes < kilobyte)) {
					return bytes + ' bytes';
			 
				} else if ((bytes >= kilobyte) && (bytes < megabyte)) {
					return (bytes / kilobyte).toFixed(0) + ' KB';
			 
				} else if ((bytes >= megabyte) && (bytes < gigabyte)) {
					return (bytes / megabyte).toFixed(1) + ' MB';
			 
				} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
					return (bytes / gigabyte).toFixed(2) + ' GB';
			 
				} else if (bytes >= terabyte) {
					return (bytes / terabyte).toFixed(2) + ' TB';
			 
				} else {
					return bytes + ' bytes';
				}
			}
			
		});