###  CONVERT DEV+OPS TO OPS FOR ORVERLAPPNG INTO ANOTHER HOSTING (Apache2.4 etc...) ###
# 1. bash mkops.sh
# 2. $ cd /var/
# 3. Plz drag&drop www.zip → /var/
# 4. $ 7z x www.zip
# 5. $ sudo rm -r /var/www.zip

echo "start"
sudo apt install p7zip-full
sudo rm -r www.zip
7z a www.zip www/html/
7z a www.zip www/keys/
7z a www.zip www/Flask/
7z a www.zip www/wsgi_h.py
7z a www.zip www/wsgi.py
