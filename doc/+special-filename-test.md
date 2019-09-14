#### Testing

Considering using '+' symbol in filename to mark as exported module.

It's fine in all modern filesystems.

But URL escaping could be a problem with accessing the file via URLs.

Testing by committing this file to github.

ANS:
- works fien in github
- navigating to the file gives the URL https://github.com/yortus/penc/blob/vnext/doc/%2Bspecial-filename-test.md
- entering the URL https://github.com/yortus/penc/blob/vnext/doc/+special-filename-test.md also works fine

