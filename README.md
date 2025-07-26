(This is just something that I was fiddling around with on the weekend and it's far from finished)

A FUSE file system to browse documents by tags.

Assuming you mount this on /your/mountpoint, then:

*  /your/mountpoint/ contains all tags as folders, all documents as symlinks to the original document
*  /your/mountpoint/tag1 contains all tags (except tag1) as folders, all documents (filtered for tag1) as symlinks to the original document
*  /your/mountpoint/tag1/tag2 contains all tags (except tag1 and tag2) as folders, all documents (filtered for tag1 and tag2) as symlinks to the original document

# Installation

* clone the repo
* run npm install
* copy .env to .env.local
* add information like an API token, your api base url, mount target and media archive root folder
* run npm start

This idea has been in my head rent-free for years now, and I finally got to do some hacking on it.

Right now, there is no synchronization mechanism and collecting all the data at the beginning takes a while, so it's all downloaded once and then saved in a .cache.json file.

That's obviously no long-term solution, so it would need webhook integration or something to actually granularly update when things change or a new document is scanned - right now the only way to update is deleting the cache file and restarting the service. 
But for a weekend hack project, I'm quite happy, and maybe it's already useful for some here? :)
